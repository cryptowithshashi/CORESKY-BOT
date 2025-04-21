// src/tui/ui.js
// Sets up the blessed Terminal UI, handles layout, event listeners, and updates.

import blessed from 'blessed';
import chalk from 'chalk';
import emitter from '../events.js'; // Listen to events from the bot logic
import createComponents from './components.js'; // Get the UI elements
import { stopBot } from '../botLogic.js'; // To cleanly stop the bot on exit
import { maskToken } from '../utils/tokenLoader.js'; // For masking tokens in status

// --- State ---
let screen = null;
let components = {};
let statusUpdateInterval = null; // Interval for updating countdown timer
let currentStatus = { // Store the latest status data
    tokensLoaded: 0,
    nextRunTimestamp: null,
    botStatus: 'INITIALIZING'
};
let loadedTokenDetails = []; // Store details like { index, maskedToken, status }

// --- Utility Functions ---

/**
 * Formats a timestamp into HH:MM:SS format.
 * @returns {string} Formatted timestamp string.
 */
const getTimestamp = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `[${hours}:${minutes}:${seconds}]`;
};

/**
 * Formats remaining time in seconds into a human-readable string (e.g., 1h 5m 10s).
 * @param {number} totalSeconds - Remaining time in seconds.
 * @returns {string} Formatted duration string.
 */
function formatRemainingTime(totalSeconds) {
    if (totalSeconds <= 0) {
        return 'Now';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    let parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`); // Show seconds if other parts are zero

    return parts.join(' ');
}


/**
 * Updates the content of the Status Info box.
 */
function updateStatusInfoBox() {
    if (!components.statusInfo) return; // Guard against component not ready

    let content = '';
    content += `${chalk.bold('Bot Status:')} ${chalk.cyan(currentStatus.botStatus)}\n`;
    content += `${chalk.bold('Tokens Loaded:')} ${currentStatus.tokensLoaded}\n`;

    // Display loaded token details (masked)
    if (loadedTokenDetails.length > 0) {
        content += `${chalk.bold('Token Status:')}\n`;
        loadedTokenDetails.forEach(t => {
            let color = chalk.white;
            if (t.status === 'Expired') color = chalk.red;
            if (t.status === 'Valid') color = chalk.green;
            content += `  Key ${t.index + 1}: ${t.maskedToken} (${color(t.status)})\n`;
        });
    }


    if (currentStatus.nextRunTimestamp && currentStatus.botStatus === 'WAITING') {
        const now = Date.now();
        const remainingMs = currentStatus.nextRunTimestamp - now;
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        const formattedTime = formatRemainingTime(remainingSeconds);
        content += `${chalk.bold('Next Check-in:')} ${chalk.yellow(formattedTime)}`;
    } else if (currentStatus.botStatus !== 'WAITING') {
         content += `${chalk.bold('Next Check-in:')} ${chalk.gray('N/A')}`;
    }

    components.statusInfo.setContent(content);
    screen.render(); // Re-render the screen after updating content
}


// --- Event Handlers ---

/**
 * Handles 'log' events emitted by the bot logic.
 * @param {{ level: string, message: string }} logData - The log data.
 */
function handleLogEvent({ level, message }) {
  if (!components.mainLog) return; // Ensure component exists

  const timestamp = getTimestamp();
  let logLine = `${timestamp} `;

  // Add emoji and color based on level
  switch (level) {
    case 'info':
      logLine += chalk.blue(`ℹ️  ${message}`);
      break;
    case 'success':
      logLine += chalk.green(`✅ ${message}`);
      // Also add successful check-ins to the success log
       if (message.includes('Sign-in successful')) {
           components.successLog?.add(logLine); // Add to success log if it exists
       }
      break;
    case 'warn':
      logLine += chalk.yellow(`⚠️ ${message}`);
       // Add "Already checked in" messages to success log as well (for visibility)
       if (message.includes('Already checked in')) {
           components.successLog?.add(`${timestamp} ${chalk.yellow(`⚠️ ${message}`)}`);
       }
      break;
    case 'error':
      logLine += chalk.red(`🚨 ${message}`);
      break;
    case 'wait':
      logLine += chalk.cyan(`⌛ ${message}`);
      break;
    default: // Keep original message if level is unknown
      logLine += message;
  }

  components.mainLog.add(logLine); // Add to the main log
  // No need to call screen.render() here, blessed log handles it
}

/**
 * Handles 'statusUpdate' events.
 * @param {object} statusData - The new status data.
 */
function handleStatusUpdate(statusData) {
    currentStatus = statusData; // Update local status store
    updateStatusInfoBox(); // Update the display

    // Clear existing interval if status is no longer 'WAITING'
    if (currentStatus.botStatus !== 'WAITING' && statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
        statusUpdateInterval = null;
    }
    // Start interval only if status is 'WAITING' and interval doesn't exist
    else if (currentStatus.botStatus === 'WAITING' && !statusUpdateInterval) {
        statusUpdateInterval = setInterval(updateStatusInfoBox, 1000); // Update countdown every second
    }
}

/**
 * Handles 'tokenStatus' events (optional, for detailed token display).
 * @param {object} tokenData - Data about a specific token.
 */
function handleTokenStatus(tokenData) {
    // Update or add the token detail
    const existingIndex = loadedTokenDetails.findIndex(t => t.index === tokenData.index);
    if (existingIndex > -1) {
        loadedTokenDetails[existingIndex] = tokenData;
    } else {
        loadedTokenDetails.push(tokenData);
    }
    loadedTokenDetails.sort((a, b) => a.index - b.index); // Keep sorted
    updateStatusInfoBox(); // Update display
}

/**
 * Handles 'checkinResult' events.
 * @param {object} resultData - Data about a check-in attempt.
 */
function handleCheckinResult(resultData) {
    // The log event handler already pushes messages to the correct logs based on level.
    // We might update the token status here if needed (e.g., mark as 'Checked' today).
    // For now, relying on the log handler is sufficient.
    // Example: Update token status visually
    const tokenDetail = loadedTokenDetails.find(t => t.index === resultData.index);
    if (tokenDetail) {
        if (resultData.success && !resultData.isDuplicate) {
            tokenDetail.status = 'Checked ✅';
        } else if (resultData.isDuplicate) {
             tokenDetail.status = 'Done Today ⚠️';
        } else if (!resultData.success && resultData.message === 'Token Expired/Invalid') {
             tokenDetail.status = 'Expired 🚨';
        } else if (!resultData.success) {
             tokenDetail.status = 'Failed ❌';
        }
         updateStatusInfoBox(); // Refresh status box with updated token state
    }
}


// --- Initialization and Cleanup ---

/**
 * Initializes the Terminal UI, sets up components, and attaches event listeners.
 * @returns {{ screen: blessed.Screen, components: object }}
 */
function initializeUI() {
  // Create the screen instance
  screen = blessed.screen({
    smartCSR: true, // Optimize cursor movements
    title: 'Core-Sky Auto Sign-In CLI',
    fullUnicode: true, // Support emojis and other unicode characters
    autoPadding: true, // Automatically add padding to elements
  });

  // Create UI components
  components = createComponents(screen);

  // --- Attach Event Listeners ---
  emitter.on('log', handleLogEvent);
  emitter.on('statusUpdate', handleStatusUpdate);
  emitter.on('tokenStatus', handleTokenStatus); // Listen for individual token status
  emitter.on('checkinResult', handleCheckinResult); // Listen for check-in results

  // --- Handle Clean Exit ---
  screen.key(['escape', 'q', 'C-c'], (ch, key) => {
    emitter.emit('log', { level: 'info', message: 'Exit requested. Cleaning up...' });
    stopBot(); // Stop any scheduled bot tasks
    if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval); // Clear the status update timer
    }
    screen.destroy(); // Destroy the blessed screen
    console.log(chalk.blueBright('\n👋 TUI closed. Goodbye!'));
    process.exit(0); // Exit the process cleanly
  });

  // Initial rendering of the screen
  screen.render();
  emitter.emit('log', { level: 'info', message: ' TUI Initialized and listening for events...' });

  // Initial status update request (or wait for botLogic to emit first)
   updateStatusInfoBox(); // Render initial status box content

  return { screen, components };
}

export default initializeUI;


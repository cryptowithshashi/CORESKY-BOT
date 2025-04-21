// src/botLogic.js
// Contains the core logic for the check-in bot, including scheduling and execution.

import emitter from './events.js';
import { loadApiKeys, maskToken } from './utils/tokenLoader.js';
import { isTokenExpiredOrInvalid } from './utils/auth.js';
import { performSign } from './services/apiClient.js';

// --- Constants ---
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DELAY_BETWEEN_ACCOUNTS_MS = 3000; // 3 seconds delay between checking each account

// --- State ---
let checkIntervalId = null; // To store the interval timer
let nextRunTimestamp = null; // Timestamp for the next scheduled run
let botStatus = 'IDLE'; // Current status of the bot
let loadedTokens = []; // Store the loaded tokens

// --- Utility Functions ---

/**
 * Delays execution for a specified amount of time.
 * @param {number} ms - Milliseconds to delay.
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Updates the bot status and emits an event.
 * @param {'INITIALIZING' | 'RUNNING' | 'WAITING' | 'PAUSED' | 'IDLE' | 'ERROR'} newStatus
 */
function updateBotStatus(newStatus) {
  botStatus = newStatus;
  emitter.emit('statusUpdate', {
    tokensLoaded: loadedTokens.length,
    nextRunTimestamp: nextRunTimestamp,
    botStatus: botStatus
  });
   emitter.emit('log', { level: 'info', message: `Bot status changed to: ${newStatus}` });
}

// --- Core Check-in Logic ---

/**
 * Performs the check-in process for all loaded tokens.
 */
async function runCheckInCycle() {
  updateBotStatus('RUNNING');
  emitter.emit('log', { level: 'info', message: '🚀 Starting check-in cycle...' });

  if (loadedTokens.length === 0) {
    emitter.emit('log', { level: 'warn', message: 'No tokens loaded, skipping check-in cycle.' });
    scheduleNextRun(); // Still schedule the next run
    return;
  }

  emitter.emit('log', { level: 'info', message: `Processing ${loadedTokens.length} account(s)...` });

  for (let i = 0; i < loadedTokens.length; i++) {
    const token = loadedTokens[i];
    const accountIndex = i;
    const masked = maskToken(token);

    emitter.emit('log', { level: 'info', message: `--- Processing Account ${accountIndex + 1} (${masked}) ---` });

    // 1. Check Token Validity (Expiration)
    if (isTokenExpiredOrInvalid(token, accountIndex)) {
      emitter.emit('log', { level: 'error', message: `[Account ${accountIndex + 1}] Token is expired or invalid. Skipping.` });
       emitter.emit('checkinResult', { index: accountIndex, success: false, message: 'Token Expired/Invalid', reward: 0, isDuplicate: false });
      // Optionally add delay even for skipped tokens
      await delay(DELAY_BETWEEN_ACCOUNTS_MS);
      continue; // Move to the next token
    }

    // 2. Perform Sign-In via API
    const result = await performSign(token, accountIndex);

     // Emit detailed result for TUI processing
     emitter.emit('checkinResult', {
        index: accountIndex,
        success: result.success,
        message: result.message,
        reward: result.reward,
        isDuplicate: result.isDuplicate
      });


    // 3. Delay before processing the next account
    if (i < loadedTokens.length - 1) {
       emitter.emit('log', { level: 'info', message: `Waiting ${DELAY_BETWEEN_ACCOUNTS_MS / 1000}s before next account...` });
       await delay(DELAY_BETWEEN_ACCOUNTS_MS);
    }
  }

  emitter.emit('log', { level: 'info', message: '✅ Check-in cycle finished.' });
  scheduleNextRun();
}

/**
 * Schedules the next check-in run and updates the status.
 */
function scheduleNextRun() {
  clearTimeout(checkIntervalId); // Clear any existing timer

  nextRunTimestamp = Date.now() + CHECK_INTERVAL_MS;
  updateBotStatus('WAITING'); // Update status to waiting

  const nextRunDate = new Date(nextRunTimestamp);
   emitter.emit('log', { level: 'wait', message: `⏳ Scheduling next check-in cycle for: ${nextRunDate.toLocaleString()}` });

  checkIntervalId = setTimeout(() => {
    runCheckInCycle(); // Run the cycle again after the interval
  }, CHECK_INTERVAL_MS);

  // Keep emitting status updates while waiting (e.g., for countdown)
  // This might be better handled within the TUI itself by calculating from nextRunTimestamp
}

// --- Control Functions ---

/**
 * Initializes and starts the bot logic.
 * Loads tokens and schedules the first run.
 */
async function startBot() {
   emitter.emit('log', { level: 'info', message: 'Initializing Core-Sky Bot Logic...' });
   updateBotStatus('INITIALIZING');

   loadedTokens = loadApiKeys(); // Load tokens initially

   // Emit initial status after loading tokens
    emitter.emit('statusUpdate', {
        tokensLoaded: loadedTokens.length,
        nextRunTimestamp: null, // Not scheduled yet
        botStatus: botStatus
    });

    // Emit status for each loaded token (optional, could be too verbose)
    // loadedTokens.forEach((token, index) => {
    //     const status = isTokenExpiredOrInvalid(token, index) ? 'Expired' : 'Valid';
    //     emitter.emit('tokenStatus', { index, maskedToken: maskToken(token), status });
    // });


   if (loadedTokens.length > 0) {
       emitter.emit('log', { level: 'info', message: 'Ready to start first check-in cycle.' });
       // Optionally start immediately or wait for the first interval
       // Starting immediately for demonstration:
       await runCheckInCycle();
   } else {
        emitter.emit('log', { level: 'error', message: 'No valid tokens loaded. Bot will wait and retry loading on the next cycle.' });
        // Schedule a run anyway, maybe tokens will be added later
        scheduleNextRun();
   }
}

/**
 * Stops the bot's scheduled execution.
 */
function stopBot() {
  if (checkIntervalId) {
    clearTimeout(checkIntervalId);
    checkIntervalId = null;
     emitter.emit('log', { level: 'info', message: '⏹️ Bot scheduling stopped.' });
  }
  nextRunTimestamp = null;
  updateBotStatus('IDLE');
}

export { startBot, stopBot };

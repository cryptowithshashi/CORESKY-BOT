// src/tui/components.js
// Defines the blessed components for the Terminal UI.

import blessed from 'blessed';
import chalk from 'chalk'; // Use chalk for coloring text within components

/**
 * Creates and configures the blessed UI components.
 * @param {blessed.Screen} screen - The main blessed screen instance.
 * @returns {object} An object containing the created blessed components.
 */
function createComponents(screen) {
  // --- 1. Banner (Top) ---
  const banner = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 3, // 1 row for border top, 1 for content, 1 for border bottom
    // Content is centered vertically and horizontally within the box
    content: `{center}${chalk.bold.blueBright('💎 CORE-SKY AUTO SIGN-IN by Crypto With Shashi 💎')}{/center}`,
    tags: true, // Enable tag processing for centering and styling
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: 'blue', // Blue border for the banner
      },
    },
  });

  // --- 2. Main Log (Bottom Left) ---
  const mainLog = blessed.log({
    parent: screen,
    label: ` ${chalk.bold('📜 Main Log')} `, // Label with padding
    tags: true, // Enable chalk tags
    top: 3, // Below the banner
    left: 0,
    width: '65%', // ~65% of screen width
    height: '100%-3', // Fill remaining height below banner
    border: {
      type: 'line',
    },
    style: {
      fg: 'white', // Default text color
      border: {
        fg: 'cyan', // Cyan border for main log
      },
      label: { // Style for the label itself
        fg: 'white',
        bold: true,
      }
    },
    scrollable: true,
    alwaysScroll: true, // Scroll to bottom on new content
    scrollbar: {
      ch: ' ', // Character for scrollbar
      inverse: true, // Inverse colors for scrollbar track
    },
    mouse: true, // Enable mouse support for scrolling
  });

  // --- 3. Success Log (Top Right) ---
   const successLog = blessed.log({
    parent: screen,
    label: ` ${chalk.bold.green('✅ Success Log')} `,
    tags: true,
    top: 3, // Below banner
    left: '65%', // To the right of the main log
    width: '35%', // Remaining width
    height: '50%-3', // Approx half of the remaining height
    border: {
      type: 'line',
    },
    style: {
      fg: 'green', // Green text for success messages
      border: {
        fg: 'green',
      },
       label: {
        fg: 'white',
        bold: true,
      }
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      inverse: true,
    },
    mouse: true,
  });

  // --- 4. Status Info (Bottom Right) ---
  const statusInfo = blessed.box({ // Use box for more control over content formatting
    parent: screen,
    label: ` ${chalk.bold.yellow('📊 Status Info')} `,
    tags: true,
    top: '50%', // Below the success log
    left: '65%',
    width: '35%',
    height: '50%', // Fill the remaining bottom right space
    border: {
      type: 'line',
    },
    style: {
      fg: 'yellow',
      border: {
        fg: 'yellow',
      },
       label: {
        fg: 'white',
        bold: true,
      }
    },
    // Content will be set dynamically
    content: ' Loading status...',
    scrollable: true, // Make it scrollable if content overflows
    alwaysScroll: false, // Don't force scroll, show top content
     scrollbar: {
      ch: ' ',
      inverse: true,
    },
    mouse: true,
  });


  // Return all created components
  return {
    banner,
    mainLog,
    successLog,
    statusInfo,
  };
}

export default createComponents;

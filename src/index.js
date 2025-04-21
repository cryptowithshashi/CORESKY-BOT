// src/index.js
// Main entry point for the core-sky-cli application.
// Initializes the TUI and starts the bot logic.

import initializeUI from './tui/ui.js';
import { startBot } from './botLogic.js';
import emitter from './events.js'; // Import emitter for initial logging if needed
import chalk from 'chalk'; // For console messages before TUI starts

// --- Graceful Shutdown Handling ---
// Ensure cleanup happens even on unexpected signals
const handleShutdown = (signal) => {
  console.log(chalk.yellow(`\nReceived ${signal}. Shutting down gracefully...`));
  // Attempt to stop the bot logic (clears timers)
  try {
    // Assuming stopBot is synchronous or quick enough
    // If stopBot were async, this would need more complex handling
    require('./botLogic').stopBot();
  } catch (e) {
    // Ignore errors if modules aren't loaded yet or other issues
  }

  // If the TUI screen exists, destroy it
  try {
    const screen = require('./tui/ui.js').screen; // Access screen if already initialized
    if (screen) {
      screen.destroy();
    }
  } catch(e) {
     // Ignore errors
  }

  console.log(chalk.blueBright('Cleanup complete. Exiting.'));
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT')); // Ctrl+C
process.on('SIGTERM', () => handleShutdown('SIGTERM')); // Termination signal
process.on('uncaughtException', (error) => {
    console.error(chalk.redBright('\n--- UNCAUGHT EXCEPTION ---'));
    console.error(error);
    console.error(chalk.redBright('--------------------------'));
    // Attempt graceful shutdown, but prioritize exiting
    handleShutdown('uncaughtException');
    process.exit(1); // Exit with error code
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.redBright('\n--- UNHANDLED REJECTION ---'));
    console.error('Reason:', reason);
    // console.error('Promise:', promise); // Can be verbose
    console.error(chalk.redBright('---------------------------'));
     // Attempt graceful shutdown, but prioritize exiting
    handleShutdown('unhandledRejection');
    process.exit(1); // Exit with error code
});


// --- Application Start ---
console.log(chalk.cyan('Starting Core-Sky CLI...'));

try {
  // 1. Initialize the Terminal UI
  // This sets up the screen and components, and starts listening for events.
  initializeUI();
  // TUI initialization logs its own success message via the emitter

  // 2. Start the Bot Logic
  // This loads tokens, schedules the first check-in, and starts emitting events.
  // Use setImmediate to ensure the TUI is fully set up before bot logic starts emitting heavily.
  setImmediate(() => {
    startBot();
  });

} catch (error) {
   console.error(chalk.redBright('🚨 Critical error during application startup:'));
   console.error(error);
   process.exit(1); // Exit immediately if core components fail to initialize
}

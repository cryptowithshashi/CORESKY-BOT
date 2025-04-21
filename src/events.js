// src/events.js
// Exports a shared EventEmitter instance for decoupling components (bot logic, TUI).

import EventEmitter from 'eventemitter3';

// Create a single instance of EventEmitter
const emitter = new EventEmitter();

// Export the instance to be used throughout the application
export default emitter;

/**
 * Expected Events:
 *
 * 'log': { level: 'info' | 'success' | 'warn' | 'error' | 'wait', message: string }
 * - Emitted by various parts of the app to log messages.
 * - Consumed by the TUI to display logs.
 *
 * 'statusUpdate': {
 * tokensLoaded: number,
 * nextRunTimestamp: number | null, // Unix timestamp ms, or null if not scheduled
 * botStatus: 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'IDLE' | 'ERROR'
 * }
 * - Emitted by botLogic to update the overall status.
 * - Consumed by the TUI status pane.
 *
 * 'tokenStatus': { index: number, maskedToken: string, status: 'Valid' | 'Expired' | 'Invalid' }
 * - Emitted when tokens are initially loaded and checked.
 * - Consumed by TUI status pane (optional, could be part of initial statusUpdate).
 *
 * 'checkinResult': {
 * index: number,
 * success: boolean,
 * message: string, // e.g., "Check-in successful! +10 points", "Already checked in", "API Error"
 * reward: number,
 * isDuplicate: boolean // Flag if it was an "already checked in" status
 * }
 * - Emitted by botLogic after each check-in attempt.
 * - Consumed by TUI log panes.
 */

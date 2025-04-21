// src/utils/tokenLoader.js
// Utility for loading and providing access to API keys/tokens from wallet.txt.

import fs from "fs";
import path from "path";
import emitter from "../events.js"; // Import emitter to log errors

// Changed filename here
const TOKEN_FILE_PATH = path.resolve(process.cwd(), "wallet.txt");

/**
 * Loads API keys from the wallet.txt file.
 * Each line in the file is expected to be a separate key.
 * Empty lines or lines starting with '#' are ignored.
 *
 * @returns {string[]} An array of loaded API keys. Returns empty array on error.
 */
function loadApiKeys() {
  // --- DEBUG LINE ADDED ---
  console.log(
    `[DEBUG] tokenLoader.js is looking for file at: ${TOKEN_FILE_PATH}`
  );
  // --- END DEBUG LINE ---

  try {
    // Check if the token file exists
    if (!fs.existsSync(TOKEN_FILE_PATH)) {
      emitter.emit("log", {
        level: "error",
        // Updated message here
        message: `Wallet file not found at ${TOKEN_FILE_PATH}. Please create it and add your tokens.`,
      });
      return []; // Return empty array if file doesn't exist
    }

    // Read the file content
    const rawTokenData = fs.readFileSync(TOKEN_FILE_PATH, "utf8");

    // Process the tokens: split by newline, trim whitespace, filter out empty lines and comments
    const apiKeys = rawTokenData
      .split(/\r?\n/) // Split by newline (Windows or Unix)
      .map((key) => key.trim()) // Remove leading/trailing whitespace
      .filter((key) => key && !key.startsWith("#")); // Filter out empty lines and comments

    // Check if any keys were actually loaded
    if (apiKeys.length === 0) {
      emitter.emit("log", {
        level: "warn",
        // Updated message here
        message: `No valid API keys found in ${TOKEN_FILE_PATH}. Ensure keys are added, one per line.`,
      });
    } else {
      emitter.emit("log", {
        level: "info",
        // Updated message here
        message: `🔑 Loaded ${apiKeys.length} API key(s) from wallet.txt.`,
      });
    }

    return apiKeys;
  } catch (error) {
    // Log any error during file reading/processing
    emitter.emit("log", {
      level: "error",
      // Updated message here
      message: `Failed to load API keys from ${TOKEN_FILE_PATH}: ${error.message}`,
    });
    return []; // Return empty array in case of error
  }
}

/**
 * Masks a token for display purposes.
 * Shows the first 3 and last 4 characters.
 * @param {string} token The token string.
 * @returns {string} The masked token.
 */
function maskToken(token) {
  if (!token || token.length < 8) {
    return "***"; // Return simple mask if token is too short
  }
  return `${token.substring(0, 3)}...${token.substring(token.length - 4)}`;
}

export { loadApiKeys, maskToken };

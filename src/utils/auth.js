// src/utils/auth.js
// Utilities related to authentication, specifically JWT handling.

import jwt from 'jsonwebtoken';
import emitter from '../events.js'; // For logging potential issues

/**
 * Checks if a JWT token is expired or invalid.
 *
 * @param {string} token The JWT token string.
 * @param {number} accountIndex The index of the account this token belongs to (for logging).
 * @returns {boolean} True if the token is expired or invalid, false otherwise.
 */
function isTokenExpiredOrInvalid(token, accountIndex) {
  if (!token) {
     emitter.emit('log', { level: 'warn', message: `[Account ${accountIndex + 1}] Provided token is empty.` });
    return true; // Treat empty token as invalid
  }

  try {
    // Decode the token without verifying the signature (we only need the payload)
    const decoded = jwt.decode(token);

    // Check if decoding was successful and if 'exp' claim exists
    if (decoded && typeof decoded.exp === 'number') {
      const expirationTime = decoded.exp * 1000; // Convert seconds to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime >= expirationTime;

      if (isExpired) {
         emitter.emit('log', { level: 'warn', message: `[Account ${accountIndex + 1}] Token is expired.` });
      }
      // Uncomment for debugging:
      // else {
      //   const expiresIn = Math.round((expirationTime - currentTime) / 1000 / 60); // minutes
      //   emitter.emit('log', { level: 'info', message: `[Account ${accountIndex + 1}] Token valid, expires in approx ${expiresIn} minutes.` });
      // }

      return isExpired; // Return true if expired, false if valid
    } else {
      // Token was decoded but didn't have an 'exp' claim or it wasn't a number
       emitter.emit('log', { level: 'warn', message: `[Account ${accountIndex + 1}] Token decoded but lacks valid 'exp' claim.` });
      return true; // Treat as invalid if 'exp' is missing or invalid
    }
  } catch (error) {
    // Handle potential errors during decoding (e.g., malformed token)
     emitter.emit('log', { level: 'error', message: `[Account ${accountIndex + 1}] Failed to decode token: ${error.message}` });
    return true; // Treat as invalid if decoding fails
  }
}

export { isTokenExpiredOrInvalid };

// src/services/apiClient.js
// Handles communication with the external Coresky API.

import axios from 'axios';
import emitter from '../events.js'; // For logging API interactions

// Define the API endpoint URL
const CORESKY_SIGN_IN_URL = 'https://www.coresky.com/api/taskwall/meme/sign';

// Define a standard User-Agent string
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 CoreSkyClient/1.0'; // Example User Agent

/**
 * Performs the daily sign-in action for a given account token.
 *
 * @param {string} token The JWT token for the account.
 * @param {number} accountIndex The index of the account (for logging).
 * @returns {Promise<{success: boolean, message: string, reward: number, isDuplicate: boolean}>}
 * An object indicating the outcome of the sign-in attempt.
 * - success: True if the API call was technically successful (HTTP 200).
 * - message: A descriptive message about the outcome.
 * - reward: The points awarded (0 if already signed in or failed).
 * - isDuplicate: True if the API indicated the user already signed in today.
 */
async function performSign(token, accountIndex) {
  const logPrefix = `[Account ${accountIndex + 1}]`; // Prefix for log messages

  try {
    emitter.emit('log', { level: 'info', message: `${logPrefix} 📡 Attempting sign-in...` });

    // Configure the request headers
    const headers = {
      'Token': token,
      'User-Agent': USER_AGENT,
      'Accept': 'application/json, text/plain, */*', // Standard accept header
      'Content-Type': 'application/json;charset=UTF-8' // Specify content type
    };

    // Make the POST request to the Coresky API
    // Sending an empty object {} as the body, as per the original script
    const response = await axios.post(CORESKY_SIGN_IN_URL, {}, {
        headers: headers,
        timeout: 15000 // Add a timeout (e.g., 15 seconds)
    });

    // --- Response Handling ---

    // Check if the response structure is as expected
    if (response && response.data && typeof response.data.code !== 'undefined') {
      const responseData = response.data;
      const responseCode = responseData.code;
      const responseMessage = responseData.message || 'No message provided.';

      // --- Success Case (API code 200) ---
      if (responseCode === 200) {
        const debugInfo = responseData.debug || {};
        const taskInfo = debugInfo.task || {};
        const rewardPoints = taskInfo.rewardPoint || 0;

        if (rewardPoints > 0) {
          // Successful sign-in with reward
          const successMsg = `${logPrefix} ✅ Sign-in successful! Reward: ${rewardPoints} points`;
          emitter.emit('log', { level: 'success', message: successMsg });
          return { success: true, message: `+${rewardPoints} points`, reward: rewardPoints, isDuplicate: false };
        } else {
          // Likely already signed in today (API returns 200 but no reward)
          const alreadyDoneMsg = `${logPrefix} ⚠️ Already checked in today.`;
          emitter.emit('log', { level: 'warn', message: alreadyDoneMsg });
          return { success: true, message: 'Already checked in', reward: 0, isDuplicate: true };
        }
      }
      // --- Failure Case (API code !== 200) ---
      else {
        const failureMsg = `${logPrefix} ❌ Sign-in failed! API Code: ${responseCode}, Message: ${responseMessage}`;
        emitter.emit('log', { level: 'error', message: failureMsg });
        return { success: false, message: `API Error (${responseCode}): ${responseMessage}`, reward: 0, isDuplicate: false };
      }
    }
    // --- Unexpected Response Structure ---
    else {
      const unexpectedMsg = `${logPrefix} ❌ Received unexpected response structure from API.`;
      emitter.emit('log', { level: 'error', message: unexpectedMsg });
      console.error("Unexpected API Response:", response.data); // Log raw response for debugging
      return { success: false, message: 'Unexpected API response format', reward: 0, isDuplicate: false };
    }

  } catch (error) {
    // --- Network or Axios Error Handling ---
    let errorMsg = `${logPrefix} 🚨 Network or request error during sign-in: ${error.message}`;
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMsg += ` | Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      // The request was made but no response was received
      errorMsg += ` | No response received from server. Check network or API status.`;
    } else {
      // Something happened in setting up the request that triggered an Error
       errorMsg += ` | Error setting up request.`;
    }
     emitter.emit('log', { level: 'error', message: errorMsg });
    return { success: false, message: `Request Error: ${error.message}`, reward: 0, isDuplicate: false };
  }
}

export { performSign }; // Export the function

// Centralized logging utility (can integrate with TUI)
import chalk from 'chalk';
import emitter from '../events.js'; // Import emitter to potentially emit log events

const getTimestamp = () => {
  const now = new Date();
  return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
};

const log = (level, message) => {
  const timestamp = getTimestamp();
  let formattedMessage = `${timestamp} `; 

  switch (level) {
    case 'info':
      formattedMessage += chalk.blue(`ℹ️ INFO: ${message}`);
      break;
    case 'success':
      formattedMessage += chalk.green(`✅ SUCCESS: ${message}`);
      break;
    case 'warn':
      formattedMessage += chalk.yellow(`⚠️ WARN: ${message}`);
      break;
    case 'error':
      formattedMessage += chalk.red(`🚨 ERROR: ${message}`);
      break;
    case 'wait':
       formattedMessage += chalk.cyan(`⌛ WAIT: ${message}`);
       break;
    default:
      formattedMessage += message;
  }
  
  // Emit event for TUI instead of direct console logging
  emitter.emit('log', { level, message }); 
  
  // Optional: Also log to console during development/debugging
  // console.log(formattedMessage);
};

export default log;

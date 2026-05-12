/**
 * Logger Utility - Disable all console logs in production
 * Usage: Instead of console.log(), use logger.log()
 * 
 * In Development: Logs show in console
 * In Production: All logs are suppressed
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  // Standard logs - disabled in production
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // Debug logs - disabled in production
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  // Info logs - disabled in production
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  // Warnings - ALWAYS shown (important for debugging)
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  // Errors - Show in production (for error tracking services)
  error: (...args) => {
    // In production, could send to error tracking service (Sentry, etc.)
    if (isDevelopment) {
      console.error(...args);
    } else {
      // Production: Send to error tracking service
      // Example: Sentry.captureException(args[0]);
    }
  },

  // Critical - Always shown
  critical: (...args) => {
    console.error('[CRITICAL]', ...args);
  },
};

export default logger;

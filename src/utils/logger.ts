/**
 * Centralized Logger Utility
 * Provides conditional logging based on NODE_ENV
 * In production, only errors are logged to reduce noise
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  /**
   * Log warnings (only in development)
   */
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Log success messages (only in development)
   */
  success: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[SUCCESS] ✅ ${message}`, ...args);
    }
  }
};

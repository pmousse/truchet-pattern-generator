/**
 * Database utility functions for browser storage
 */

/**
 * Gets the prefix used for all database keys in localStorage
 */
export const getDatabasePrefix = () => {
  return 'truchet-generator:';
};

/**
 * Gets all database keys from localStorage
 */
export const getDatabaseKeys = () => {
  return Object.keys(localStorage)
    .filter(key => key.startsWith(getDatabasePrefix()));
};

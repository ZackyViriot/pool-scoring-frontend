/**
 * Safely parse JSON from localStorage with error handling
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed value or default value
 */
export const safeParseLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    return parsed;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error);
    
    // If parsing fails, remove the corrupted data
    try {
      localStorage.removeItem(key);
    } catch (removeError) {
      console.error('Failed to remove corrupted localStorage item:', removeError);
    }
    
    return defaultValue;
  }
};

/**
 * Safely save data to localStorage with error handling
 * @param {string} key - The localStorage key
 * @param {any} value - The value to save
 * @returns {boolean} Success status
 */
export const safeSaveLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Get specific property from saved game state with fallback
 * @param {string} property - The property to get from saved game
 * @param {any} defaultValue - Default value if property doesn't exist
 * @returns {any} Property value or default
 */
export const getSavedGameProperty = (property, defaultValue) => {
  const savedGame = safeParseLocalStorage('poolGame', {});
  return savedGame && savedGame[property] !== undefined ? savedGame[property] : defaultValue;
}; 
import { safeParseLocalStorage, safeSaveLocalStorage, getSavedGameProperty } from '../localStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    // Add a method to directly set store values for testing
    __setMockData: (key, value) => {
      store[key] = value;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console methods
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('safeParseLocalStorage', () => {
    it('should return default value when key does not exist', () => {
      const result = safeParseLocalStorage('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should parse valid JSON correctly', () => {
      localStorageMock.__setMockData('validKey', JSON.stringify({ test: 'value' }));
      const result = safeParseLocalStorage('validKey', null);
      expect(result).toEqual({ test: 'value' });
    });

    it('should handle invalid JSON gracefully', () => {
      // Simulate corrupted localStorage data
      localStorageMock.getItem.mockReturnValueOnce('{invalid json}');
      
      const result = safeParseLocalStorage('corruptedKey', 'fallback');
      
      expect(result).toBe('fallback');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse localStorage key "corruptedKey":',
        expect.any(SyntaxError)
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('corruptedKey');
    });

    it('should handle partial JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('{"gameStarted": true, "player1":');
      
      const result = safeParseLocalStorage('partialJson', { default: true });
      
      expect(result).toEqual({ default: true });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should handle non-object JSON', () => {
      localStorageMock.__setMockData('stringValue', '"just a string"');
      
      const result = safeParseLocalStorage('stringValue', null);
      
      expect(result).toBe('just a string');
    });
  });

  describe('safeSaveLocalStorage', () => {
    it('should save valid data successfully', () => {
      const testData = { gameStarted: true, score: 100 };
      
      const result = safeSaveLocalStorage('gameData', testData);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gameData',
        JSON.stringify(testData)
      );
    });

    it('should handle save errors gracefully', () => {
      // Mock localStorage.setItem to throw an error (quota exceeded)
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });
      
      const result = safeSaveLocalStorage('failKey', { data: 'test' });
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save to localStorage key "failKey":',
        expect.any(Error)
      );
    });

    it('should handle circular references', () => {
      // Create circular reference
      const circularObject = { name: 'test' };
      circularObject.self = circularObject;
      
      const result = safeSaveLocalStorage('circular', circularObject);
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getSavedGameProperty', () => {
    it('should return property from valid saved game', () => {
      const gameData = {
        gameStarted: true,
        activePlayer: 2,
        player1: { name: 'Alice', score: 50 }
      };
      localStorageMock.__setMockData('poolGame', JSON.stringify(gameData));
      
      expect(getSavedGameProperty('gameStarted', false)).toBe(true);
      expect(getSavedGameProperty('activePlayer', 1)).toBe(2);
      expect(getSavedGameProperty('player1', {})).toEqual({ name: 'Alice', score: 50 });
    });

    it('should return default when property does not exist', () => {
      const gameData = { gameStarted: true };
      localStorageMock.__setMockData('poolGame', JSON.stringify(gameData));
      
      expect(getSavedGameProperty('nonExistentProp', 'default')).toBe('default');
    });

    it('should return default when saved game is corrupted', () => {
      localStorageMock.getItem.mockReturnValueOnce('{corrupted');
      
      expect(getSavedGameProperty('gameStarted', false)).toBe(false);
    });

    it('should return default when no saved game exists', () => {
      expect(getSavedGameProperty('gameStarted', false)).toBe(false);
    });

    it('should handle undefined values correctly', () => {
      const gameData = { gameStarted: undefined, score: null };
      localStorageMock.__setMockData('poolGame', JSON.stringify(gameData));
      
      expect(getSavedGameProperty('gameStarted', true)).toBe(true); // undefined returns default
      expect(getSavedGameProperty('score', 0)).toBe(null); // null is a valid value
    });
  });

  describe('Real-world corruption scenarios', () => {
    it('should handle browser crash during save', () => {
      // Simulate interrupted save (partial JSON)
      localStorageMock.getItem.mockReturnValueOnce('{"gameStarted":true,"player1":{"name":"Test","score"');
      
      const result = getSavedGameProperty('gameStarted', false);
      
      expect(result).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('poolGame');
    });

    it('should handle storage quota exceeded', () => {
      // First save works
      expect(safeSaveLocalStorage('test1', { data: 'small' })).toBe(true);
      
      // Second save fails due to quota
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      expect(safeSaveLocalStorage('test2', { data: 'large' })).toBe(false);
    });

    it('should handle concurrent access corruption', () => {
      // Simulate data being modified between read and parse
      let callCount = 0;
      localStorageMock.getItem.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return '{"valid": "json"}';
        return '{invalid'; // Corrupted on second call
      });
      
      // First call should work
      expect(safeParseLocalStorage('concurrent', null)).toEqual({ valid: 'json' });
      
      // Second call should handle corruption
      expect(safeParseLocalStorage('concurrent', null)).toBe(null);
    });
  });
}); 
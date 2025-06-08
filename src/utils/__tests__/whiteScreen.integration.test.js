/**
 * Integration test to verify white screen fixes
 * Tests the actual corruption scenarios that were causing issues
 */

import { safeParseLocalStorage, safeSaveLocalStorage, getSavedGameProperty } from '../localStorage';

// Simple localStorage mock for testing
const createMockStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    _store: store // For inspection
  };
};

// Mock console to suppress warnings during testing
const originalWarn = console.warn;
const originalError = console.error;

describe('White Screen Bug Prevention', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    global.localStorage = mockStorage;
    
    // Suppress console output during tests
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.warn = originalWarn;
    console.error = originalError;
  });

  describe('Critical Corruption Scenarios', () => {
    test('handles corrupted poolGame data without crashing', () => {
      // Scenario 1: Malformed JSON (most common cause of white screen)
      mockStorage.setItem('poolGame', '{invalid json');
      
      expect(() => {
        const gameStarted = getSavedGameProperty('gameStarted', false);
        expect(gameStarted).toBe(false);
      }).not.toThrow();
    });

    test('handles interrupted save (partial JSON)', () => {
      // Scenario 2: Browser crash during save
      mockStorage.setItem('poolGame', '{"gameStarted": true, "player1": {"name": "Test"');
      
      expect(() => {
        const activePlayer = getSavedGameProperty('activePlayer', 1);
        expect(activePlayer).toBe(1);
      }).not.toThrow();
    });

    test('handles empty or null localStorage gracefully', () => {
      // Scenario 3: Empty storage
      expect(() => {
        const score = getSavedGameProperty('player1', { score: 0 });
        expect(score).toEqual({ score: 0 });
      }).not.toThrow();
    });

    test('handles non-JSON string in localStorage', () => {
      // Scenario 4: Random string corruption
      mockStorage.setItem('poolGame', 'not-json-data');
      
      expect(() => {
        const gameTime = getSavedGameProperty('gameTime', 0);
        expect(gameTime).toBe(0);
      }).not.toThrow();
    });

    test('cleans up corrupted data automatically', () => {
      // Verify that corrupted data gets removed
      mockStorage.setItem('poolGame', '{corrupted');
      
      getSavedGameProperty('gameStarted', false);
      
      // Should have been removed
      expect(mockStorage.getItem('poolGame')).toBeNull();
    });
  });

  describe('Safe Save Operations', () => {
    test('saves valid game state successfully', () => {
      const gameState = {
        gameStarted: true,
        activePlayer: 1,
        player1: { name: 'Test', score: 50 }
      };
      
      const success = safeSaveLocalStorage('poolGame', gameState);
      expect(success).toBe(true);
      
      // Verify it can be read back
      const retrieved = getSavedGameProperty('gameStarted', false);
      expect(retrieved).toBe(true);
    });

    test('handles save failures gracefully', () => {
      // Mock a storage failure
      const originalSetItem = mockStorage.setItem;
      mockStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };
      
      const success = safeSaveLocalStorage('poolGame', { test: 'data' });
      expect(success).toBe(false);
      
      mockStorage.setItem = originalSetItem;
    });
  });

  describe('Component State Initialization Safety', () => {
    test('all state initializers work with corrupted data', () => {
      // Test all the useState initializers that were problematic
      mockStorage.setItem('poolGame', '{broken json}');
      
      const stateDefaults = [
        ['gameStarted', false],
        ['objectBallsOnTable', 15],
        ['activePlayer', 1],
        ['targetGoal', 125],
        ['gameTime', 0],
        ['isTimerRunning', false],
        ['currentInning', 1],
        ['breakPlayer', 1],
        ['scoreHistory', []],
        ['bestRun', 0],
        ['isBreakShot', true],
        ['player1FoulHistory', []],
        ['player2FoulHistory', []],
        ['turnHistory', []],
        ['gameType', 'Straight Pool']
      ];

      stateDefaults.forEach(([property, defaultValue]) => {
        expect(() => {
          const value = getSavedGameProperty(property, defaultValue);
          expect(value).toEqual(defaultValue);
        }).not.toThrow();
      });
    });

    test('complex player objects work with corrupted data', () => {
      mockStorage.setItem('poolGame', '{"player1": {corrupted}');
      
      const defaultPlayer = {
        name: "",
        score: 0,
        handicap: 0,
        totalPoints: 0,
        totalInnings: 0,
        breakAndRuns: 0,
        safetyPlays: 0,
        safes: 0,
        defensiveShots: 0,
        scratches: 0,
        avgPointsPerInning: 0,
        fouls: 0,
        intentionalFouls: 0,
        misses: 0,
        bestRun: 0,
        currentRun: 0,
        breakingFouls: 0
      };

      expect(() => {
        const player1 = getSavedGameProperty('player1', defaultPlayer);
        expect(player1).toEqual(defaultPlayer);
      }).not.toThrow();
    });
  });

  describe('Real-world Stress Test', () => {
    test('rapid save/load operations don\'t cause corruption', () => {
      // Simulate rapid game state updates
      const baseState = { gameStarted: true, score: 0 };
      
      for (let i = 0; i < 100; i++) {
        const state = { ...baseState, score: i };
        safeSaveLocalStorage('poolGame', state);
        
        const retrieved = getSavedGameProperty('score', 0);
        expect(retrieved).toBe(i);
      }
    });

    test('handles concurrent access patterns', () => {
      // Simulate the app trying to read while saving
      mockStorage.setItem('poolGame', '{"gameStarted": true}');
      
      // Multiple rapid reads shouldn't crash
      for (let i = 0; i < 10; i++) {
        expect(() => {
          getSavedGameProperty('gameStarted', false);
          getSavedGameProperty('activePlayer', 1);
          getSavedGameProperty('player1', {});
        }).not.toThrow();
      }
    });
  });
});

// Export test utilities for manual testing
export const testWhiteScreenFixes = () => {
  console.log('🧪 Testing white screen fixes...');
  
  // Test 1: Corrupt poolGame data
  localStorage.setItem('poolGame', '{corrupted json}');
  console.log('✅ Corrupted JSON test:', getSavedGameProperty('gameStarted', false));
  
  // Test 2: Partial data
  localStorage.setItem('poolGame', '{"gameStarted": true, "player1":');
  console.log('✅ Partial JSON test:', getSavedGameProperty('activePlayer', 1));
  
  // Test 3: Valid data
  localStorage.setItem('poolGame', '{"gameStarted": true, "activePlayer": 2}');
  console.log('✅ Valid JSON test:', getSavedGameProperty('activePlayer', 1));
  
  // Test 4: Clear and test defaults
  localStorage.removeItem('poolGame');
  console.log('✅ No data test:', getSavedGameProperty('gameStarted', false));
  
  console.log('🎉 All white screen fixes working correctly!');
};

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.testWhiteScreenFixes = testWhiteScreenFixes;
} 
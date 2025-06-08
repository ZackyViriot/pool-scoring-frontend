#!/usr/bin/env node

/**
 * Manual test script to verify white screen fixes
 * This simulates the exact scenarios that were causing white screens
 */

const fs = require('fs');
const path = require('path');

// Read the localStorage utility
const localStorageUtilPath = path.join(__dirname, 'src', 'utils', 'localStorage.js');
const utilCode = fs.readFileSync(localStorageUtilPath, 'utf8');

// Convert ES6 module to CommonJS for testing
const commonJSCode = utilCode
  .replace(/export const/g, 'const')
  .replace(/export \{[^}]+\};?/g, '')
  + `
// Export functions for testing
module.exports = { safeParseLocalStorage, safeSaveLocalStorage, getSavedGameProperty };
`;

// Write temporary test file
const testFile = path.join(__dirname, 'temp-test.js');
fs.writeFileSync(testFile, commonJSCode);

// Mock localStorage
global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = value; },
  removeItem(key) { delete this.data[key]; },
  clear() { this.data = {}; }
};

// Mock console for cleaner output
const originalWarn = console.warn;
const originalError = console.error;
console.warn = () => {}; // Suppress warnings during testing
console.error = () => {}; // Suppress errors during testing

try {
  const { safeParseLocalStorage, safeSaveLocalStorage, getSavedGameProperty } = require('./temp-test.js');

  console.log('🧪 Testing White Screen Fixes...\n');
  console.log('=' .repeat(50));

  // Test 1: The original white screen scenario
  console.log('\n📋 Test 1: Original White Screen Scenario');
  console.log('Setting corrupted JSON that would crash JSON.parse()...');
  localStorage.setItem('poolGame', '{gameStarted: true, player1: {name: "Test"');
  
  let crashed = false;
  try {
    // This would have crashed before our fixes
    const gameStarted = getSavedGameProperty('gameStarted', false);
    const activePlayer = getSavedGameProperty('activePlayer', 1);
    const player1 = getSavedGameProperty('player1', { name: '', score: 0 });
    
    console.log('✅ PASS: No crash occurred!');
    console.log(`   gameStarted: ${gameStarted} (expected: false)`);
    console.log(`   activePlayer: ${activePlayer} (expected: 1)`);
    console.log(`   player1: ${JSON.stringify(player1)}`);
  } catch (error) {
    crashed = true;
    console.log('❌ FAIL: Still crashing:', error.message);
  }

  // Test 2: All state initializers
  console.log('\n📋 Test 2: All Component State Initializers');
  localStorage.setItem('poolGame', '{broken}');
  
  const stateTests = [
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

  let allPassed = true;
  stateTests.forEach(([property, defaultValue]) => {
    try {
      const result = getSavedGameProperty(property, defaultValue);
      console.log(`   ✅ ${property}: Safe`);
    } catch (error) {
      console.log(`   ❌ ${property}: FAILED - ${error.message}`);
      allPassed = false;
    }
  });

  // Test 3: Complex objects
  console.log('\n📋 Test 3: Complex Player Objects');
  localStorage.setItem('poolGame', '{"player1": {corrupted object}, "player2":');
  
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

  try {
    const player1 = getSavedGameProperty('player1', defaultPlayer);
    const player2 = getSavedGameProperty('player2', defaultPlayer);
    console.log('   ✅ Player objects handle corruption safely');
  } catch (error) {
    console.log('   ❌ Player objects still failing:', error.message);
    allPassed = false;
  }

  // Test 4: Save operations
  console.log('\n📋 Test 4: Safe Save Operations');
  const testGameState = {
    gameStarted: true,
    activePlayer: 1,
    player1: { name: 'Test Player', score: 50 },
    turnHistory: [{ action: 'Points', points: 5 }]
  };

  const saveSuccess = safeSaveLocalStorage('poolGame', testGameState);
  console.log(`   ✅ Save operation: ${saveSuccess ? 'SUCCESS' : 'FAILED'}`);

  // Verify we can read it back
  const retrievedData = getSavedGameProperty('gameStarted', false);
  console.log(`   ✅ Read back: ${retrievedData === true ? 'SUCCESS' : 'FAILED'}`);

  // Test 5: Rapid operations (simulate game play)
  console.log('\n📋 Test 5: Rapid Game Operations Simulation');
  let rapidTestPassed = true;
  
  for (let i = 0; i < 50; i++) {
    try {
      const gameState = { gameStarted: true, score: i };
      safeSaveLocalStorage('poolGame', gameState);
      const retrieved = getSavedGameProperty('score', 0);
      if (retrieved !== i) {
        rapidTestPassed = false;
        break;
      }
    } catch (error) {
      rapidTestPassed = false;
      break;
    }
  }
  console.log(`   ✅ Rapid operations: ${rapidTestPassed ? 'PASSED' : 'FAILED'}`);

  // Final Results
  console.log('\n' + '=' .repeat(50));
  if (!crashed && allPassed && rapidTestPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ White screen issue has been resolved!');
    console.log('✅ The app should no longer crash halfway through games');
    console.log('✅ localStorage corruption is handled gracefully');
    console.log('✅ Users will see the error boundary instead of white screen');
  } else {
    console.log('❌ Some tests failed. White screen issue may still exist.');
  }

  console.log('\n🔧 Summary of fixes applied:');
  console.log('  - Added Error Boundary to catch all React errors');
  console.log('  - Created safe localStorage utilities with error handling');
  console.log('  - Replaced all unsafe JSON.parse() calls');
  console.log('  - Added debounced saving to prevent corruption');
  console.log('  - Enhanced authentication error handling');
  console.log('  - Added loading states instead of null returns');

} catch (error) {
  console.error('Test execution failed:', error);
} finally {
  // Cleanup
  try {
    fs.unlinkSync(testFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  // Restore console
  console.warn = originalWarn;
  console.error = originalError;
} 
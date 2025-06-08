/**
 * Test utility to simulate localStorage corruption scenarios
 * This can be used in the browser console to test error handling
 */

export const testLocalStorageCorruption = () => {
  console.log('Testing localStorage corruption scenarios...');
  
  // Test 1: Invalid JSON
  console.log('Test 1: Setting invalid JSON');
  localStorage.setItem('poolGame', '{invalid json}');
  
  // Test 2: Partial JSON
  console.log('Test 2: Setting partial JSON');
  localStorage.setItem('poolGame', '{"gameStarted": true, "player1":');
  
  // Test 3: Non-object JSON
  console.log('Test 3: Setting non-object JSON');
  localStorage.setItem('poolGame', '"just a string"');
  
  // Test 4: Very large object (might cause quota exceeded)
  console.log('Test 4: Setting very large object');
  const largeObject = {
    gameStarted: true,
    largeArray: new Array(100000).fill('test data')
  };
  
  try {
    localStorage.setItem('poolGame', JSON.stringify(largeObject));
  } catch (e) {
    console.log('Large object test caused error (expected):', e.message);
  }
  
  console.log('Corruption tests complete. Reload the app to see how it handles these scenarios.');
};

export const clearTestData = () => {
  localStorage.removeItem('poolGame');
  console.log('Test data cleared');
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.testLocalStorageCorruption = testLocalStorageCorruption;
  window.clearTestData = clearTestData;
} 
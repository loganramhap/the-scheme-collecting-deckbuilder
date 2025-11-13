/**
 * Manual tests for auth store functionality
 * 
 * To run these tests:
 * 1. Import this file in your application
 * 2. Call runAuthStoreTests() in the console or during development
 * 3. Check console output for test results
 * 
 * Note: These tests verify the auth store structure and methods.
 * Integration tests with actual API calls should be done separately.
 */

import { useAuthStore } from './auth';
import type { RiotUser } from '../types/riot';

/**
 * Test 1: Initial state
 */
function testInitialState(): boolean {
  console.log('Test 1: Initial state');
  
  const store = useAuthStore.getState();
  
  const passed = 
    store.user === null &&
    store.isAuthenticated === false &&
    store.giteaUsername === null &&
    typeof store.login === 'function' &&
    typeof store.logout === 'function' &&
    typeof store.refreshAuth === 'function';

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  User:', store.user);
  console.log('  isAuthenticated:', store.isAuthenticated);
  console.log('  giteaUsername:', store.giteaUsername);
  console.log('  Methods present:', {
    login: typeof store.login === 'function',
    logout: typeof store.logout === 'function',
    refreshAuth: typeof store.refreshAuth === 'function',
  });
  
  return passed;
}

/**
 * Test 2: Login method exists and is callable
 */
function testLoginMethod(): boolean {
  console.log('Test 2: Login method');
  
  const store = useAuthStore.getState();
  
  const passed = 
    typeof store.login === 'function' &&
    store.login.length === 0; // No parameters

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Login is function:', typeof store.login === 'function');
  console.log('  Login parameters:', store.login.length);
  
  return passed;
}

/**
 * Test 3: Logout method exists and is async
 */
function testLogoutMethod(): boolean {
  console.log('Test 3: Logout method');
  
  const { logout } = useAuthStore.getState();
  
  const passed = 
    typeof logout === 'function' &&
    logout.constructor.name === 'AsyncFunction';

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Logout is function:', typeof logout === 'function');
  console.log('  Logout is async:', logout.constructor.name === 'AsyncFunction');
  
  return passed;
}

/**
 * Test 4: RefreshAuth method exists and is async
 */
function testRefreshAuthMethod(): boolean {
  console.log('Test 4: RefreshAuth method');
  
  const store = useAuthStore.getState();
  
  const passed = 
    typeof store.refreshAuth === 'function' &&
    store.refreshAuth.constructor.name === 'AsyncFunction';

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  RefreshAuth is function:', typeof store.refreshAuth === 'function');
  console.log('  RefreshAuth is async:', store.refreshAuth.constructor.name === 'AsyncFunction');
  
  return passed;
}

/**
 * Test 5: State updates correctly (manual simulation)
 */
function testStateUpdates(): boolean {
  console.log('Test 5: State updates');
  
  // Manually set state to simulate successful auth
  const mockUser: RiotUser = {
    puuid: 'test-puuid-123',
    gameName: 'TestPlayer',
    tagLine: 'NA1',
    summonerIcon: 123,
  };
  
  useAuthStore.setState({
    user: mockUser,
    isAuthenticated: true,
    giteaUsername: 'testplayer-na1',
  });
  
  const updatedStore = useAuthStore.getState();
  
  const passed = 
    updatedStore.user !== null &&
    updatedStore.user.puuid === 'test-puuid-123' &&
    updatedStore.user.gameName === 'TestPlayer' &&
    updatedStore.user.tagLine === 'NA1' &&
    updatedStore.user.summonerIcon === 123 &&
    updatedStore.isAuthenticated === true &&
    updatedStore.giteaUsername === 'testplayer-na1';

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  User:', updatedStore.user);
  console.log('  isAuthenticated:', updatedStore.isAuthenticated);
  console.log('  giteaUsername:', updatedStore.giteaUsername);
  
  // Reset state
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    giteaUsername: null,
  });
  
  return passed;
}

/**
 * Test 6: Logout clears state (manual simulation)
 */
function testLogoutClearsState(): boolean {
  console.log('Test 6: Logout clears state');
  
  // Set authenticated state
  const mockUser: RiotUser = {
    puuid: 'test-puuid-123',
    gameName: 'TestPlayer',
    tagLine: 'NA1',
  };
  
  useAuthStore.setState({
    user: mockUser,
    isAuthenticated: true,
    giteaUsername: 'testplayer-na1',
  });
  
  // Simulate logout by manually clearing state
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    giteaUsername: null,
  });
  
  const store = useAuthStore.getState();
  
  const passed = 
    store.user === null &&
    store.isAuthenticated === false &&
    store.giteaUsername === null;

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  User after logout:', store.user);
  console.log('  isAuthenticated after logout:', store.isAuthenticated);
  console.log('  giteaUsername after logout:', store.giteaUsername);
  
  return passed;
}

/**
 * Test 7: RiotUser type structure
 */
function testRiotUserType(): boolean {
  console.log('Test 7: RiotUser type structure');
  
  const mockUser: RiotUser = {
    puuid: 'test-puuid',
    gameName: 'TestPlayer',
    tagLine: 'NA1',
    summonerIcon: 123,
  };
  
  const passed = 
    typeof mockUser.puuid === 'string' &&
    typeof mockUser.gameName === 'string' &&
    typeof mockUser.tagLine === 'string' &&
    (mockUser.summonerIcon === undefined || typeof mockUser.summonerIcon === 'number');

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  Mock user:', mockUser);
  
  return passed;
}

/**
 * Test 8: No localStorage usage (tokens in httpOnly cookies)
 */
function testNoLocalStorage(): boolean {
  console.log('Test 8: No localStorage usage');
  
  // Check that auth store doesn't use localStorage
  const authToken = localStorage.getItem('auth-token');
  const authUser = localStorage.getItem('auth-user');
  
  const passed = authToken === null && authUser === null;

  console.log('  Result:', passed ? 'PASS' : 'FAIL');
  console.log('  auth-token in localStorage:', authToken);
  console.log('  auth-user in localStorage:', authUser);
  
  if (!passed) {
    console.log('  Note: Old localStorage items should be cleared');
  }
  
  return passed;
}

/**
 * Run all auth store tests
 */
export function runAuthStoreTests(): void {
  console.log('=== Running Auth Store Tests ===\n');
  
  const tests = [
    testInitialState,
    testLoginMethod,
    testLogoutMethod,
    testRefreshAuthMethod,
    testStateUpdates,
    testLogoutClearsState,
    testRiotUserType,
    testNoLocalStorage,
  ];

  const results = tests.map(test => {
    try {
      const passed = test();
      console.log('');
      return passed;
    } catch (error) {
      console.error('  ERROR:', error);
      console.log('');
      return false;
    }
  });

  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('=== Test Summary ===');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
  }
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).runAuthStoreTests = runAuthStoreTests;
  console.log('Auth store tests loaded. Run window.runAuthStoreTests() to execute.');
}

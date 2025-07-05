/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'], // Looks for test files in a 'tests' directory
  verbose: true, // Displays individual test results with the test suite hierarchy.
  forceExit: true, // Ensures Jest exits cleanly after tests, especially with open handles like a DB pool.
  clearMocks: true, // Automatically clears mock calls and instances between every test.
};
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['./backend/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  detectOpenHandles: true,
  maxWorkers: 1,
  maxConcurrency: 1,
  bail: false,
  globals: {
    'TEST_TIMEOUT': 30000
  },
  testRunner: 'jest-circus/runner',
  testSequencer: './backend/tests/customSequencer.js',
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}; 
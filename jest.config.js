module.exports = {
    testEnvironment: 'node',
    testTimeout: 60000,
    verbose: true,
    setupFilesAfterEnv: ['./jest.setup.js'],
    collectCoverage: false,
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/mocks/'
    ],
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    detectOpenHandles: true,
    forceExit: true,
    globals: {
        MONGO_URI_TEST: process.env.MONGO_URI_TEST
    },
    silent: false,
    verbose: true
};
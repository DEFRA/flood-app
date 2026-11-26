module.exports = {
  testEnvironment: 'node',
  restoreMocks: true,
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/test/lib/helpers/mock-logger.js'],
  testMatch: ['**/test/**/*.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/test/data/',
    '<rootDir>/test/dom.js',
    '<rootDir>/test/lib/flush-app-require-cache.js',
    '<rootDir>/test/lib/helpers/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/webpack.config.js',
    '<rootDir>/release-docs/',
    '<rootDir>/test/'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageReporters: ['lcov', 'text'],
  coverageDirectory: 'coverage'
}

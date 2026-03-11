module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    '!app/api/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};

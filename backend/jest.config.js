module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts', '**/*e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts']
};

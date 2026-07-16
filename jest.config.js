module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        strict: false,
      },
    }],
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.ts',
    '!services/**/*.d.ts',
  ],
};

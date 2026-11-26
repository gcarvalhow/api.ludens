import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/__tests__/e2e/'],
  moduleNameMapper: {
    '^@booking/(.*)$': '<rootDir>/src/features/booking/$1',
    '^@catalog/(.*)$': '<rootDir>/src/features/catalog/$1',
    '^@web/(.*)$': '<rootDir>/src/$1',
    '^@account/(.*)$': '<rootDir>/src/features/account/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
  },
};

export default createJestConfig(config);

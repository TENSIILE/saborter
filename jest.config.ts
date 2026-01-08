const path = require('path');

const config = {
  roots: ['<rootDir>/src'],
  testEnvironment: path.join(__dirname, 'node_modules', 'jest-environment-jsdom'),
  preset: 'ts-jest',
  moduleDirectories: ['node_modules'],
  verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.ts?$': 'ts-jest'
  },
  transformIgnorePatterns: ['node_modules'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js']
};

module.exports = config;

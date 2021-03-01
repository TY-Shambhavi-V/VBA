module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  globals: {
    PATH: 'http://localhost:8080'
  },
  transform: {
    '^.+\\.svg$': '<rootDir>/private/jest/svgMock.js'
  },
  moduleNameMapper: {
    '^atoms(.*)$': '<rootDir>/src/components/atoms$1',
    '^molecules(.*)$': '<rootDir>/src/components/molecules$1',
    '^organism(.*)$': '<rootDir>/src/components/organism$1',
    '^templates(.*)$': '<rootDir>/src/components/templates$1',
    '^pages(.*)$': '<rootDir>/src/components/pages$1'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts,vue}',
    '!src/main.js', // No need to cover bootstrap file
    '!src/**/*.stories.js'
  ],
  testMatch: [
    '**/src/**/*.test.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'
  ]
}

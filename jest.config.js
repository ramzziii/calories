module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: [
    "@testing-library/jest-native/extend-expect",
    "<rootDir>/jest.setup.ts",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|expo(-.*)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|victory-native|victory-.*)/)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/screens/**", // screens covered via component/E2E tests, not unit coverage gate
    "!src/**/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 65,
      lines: 65,
      statements: 65,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

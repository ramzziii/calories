// Global test setup — runs before each test file.
import "react-native-gesture-handler/jestSetup";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-constants", () => ({
  expoConfig: { extra: {} },
}));

// Defaults to a non-US region so useUnitsStore's locale-based default is
// "metric" in tests, matching what most existing test expectations assume.
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-GB", regionCode: "GB" }],
}));

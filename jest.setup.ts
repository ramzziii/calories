// Global test setup — runs before each test file.
import "react-native-gesture-handler/jestSetup";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-constants", () => ({
  expoConfig: { extra: {} },
}));

// Silence noisy RN Animated warnings during tests.
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

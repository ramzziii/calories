// Global test setup — runs before each test file.
import "react-native-gesture-handler/jestSetup";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Includes ExecutionEnvironment as a real named export (not just the
// default Constants object) — services that check
// Constants.executionEnvironment === ExecutionEnvironment.StoreClient at
// module load time (revenuecat.ts, healthSync.ts) throw immediately
// otherwise, since ExecutionEnvironment would be undefined.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: {} },
    // "standalone" (a real build, not Expo Go) so code paths gated on
    // "not running in Expo Go" are exercised by default in tests.
    executionEnvironment: "standalone",
  },
  ExecutionEnvironment: {
    Bare: "bare",
    Standalone: "standalone",
    StoreClient: "storeClient",
  },
}));

// Defaults to a non-US region so useUnitsStore's locale-based default is
// "metric" in tests, matching what most existing test expectations assume.
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-GB", regionCode: "GB" }],
}));

// In-memory stand-in for the Keychain/Keystore-backed session storage
// src/services/supabase.ts uses instead of AsyncStorage.
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
}));

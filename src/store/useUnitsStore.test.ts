import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUnitsStore } from "@/store/useUnitsStore";

describe("useUnitsStore default detection", () => {
  afterEach(() => {
    jest.dontMock("expo-localization");
  });

  it("defaults to metric when the device locale region is not US", () => {
    // jest.setup.ts globally mocks expo-localization to region "GB".
    expect(useUnitsStore.getState().system).toBe("metric");
  });

  it("defaults to imperial when the device locale region is US", () => {
    jest.resetModules();
    jest.doMock("expo-localization", () => ({
      getLocales: () => [{ languageTag: "en-US", regionCode: "US" }],
    }));

    let freshStore: typeof useUnitsStore;
    jest.isolateModules(() => {
      freshStore = require("@/store/useUnitsStore").useUnitsStore;
    });

    expect(freshStore!.getState().system).toBe("imperial");
  });
});

describe("useUnitsStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
    useUnitsStore.setState({ system: "metric", isHydrated: false });
  });

  describe("hydrate", () => {
    it("keeps the locale-derived default when nothing is stored", async () => {
      await useUnitsStore.getState().hydrate();
      const state = useUnitsStore.getState();
      expect(state.system).toBe("metric");
      expect(state.isHydrated).toBe(true);
    });

    it("applies a previously stored override", async () => {
      await AsyncStorage.setItem("plateful:unit_system", JSON.stringify("imperial"));
      await useUnitsStore.getState().hydrate();
      const state = useUnitsStore.getState();
      expect(state.system).toBe("imperial");
      expect(state.isHydrated).toBe(true);
    });

    it("still marks the store hydrated even if reading storage fails", async () => {
      jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));
      await useUnitsStore.getState().hydrate();
      expect(useUnitsStore.getState().isHydrated).toBe(true);
    });
  });

  describe("setSystem", () => {
    it("updates state immediately", async () => {
      await useUnitsStore.getState().setSystem("imperial");
      expect(useUnitsStore.getState().system).toBe("imperial");
    });

    it("persists the choice so a later hydrate() picks it up", async () => {
      await useUnitsStore.getState().setSystem("imperial");
      useUnitsStore.setState({ system: "metric", isHydrated: false });

      await useUnitsStore.getState().hydrate();

      expect(useUnitsStore.getState().system).toBe("imperial");
    });

    it("does not throw when persisting fails", async () => {
      jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("disk full"));
      await expect(
        useUnitsStore.getState().setSystem("imperial")
      ).resolves.toBeUndefined();
      expect(useUnitsStore.getState().system).toBe("imperial");
    });
  });
});

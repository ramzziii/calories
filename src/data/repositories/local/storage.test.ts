import AsyncStorage from "@react-native-async-storage/async-storage";
import { RepositoryError } from "@/data/repositories/types";
import { readJson, removeKey, writeJson } from "@/data/repositories/local/storage";

describe("local storage helpers", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  describe("readJson", () => {
    it("returns the fallback when the key is not present", async () => {
      const result = await readJson("missing_key", { default: true });
      expect(result).toEqual({ default: true });
    });

    it("returns the parsed value when the key is present", async () => {
      await AsyncStorage.setItem("plateful:some_key", JSON.stringify({ a: 1 }));
      const result = await readJson("some_key", null);
      expect(result).toEqual({ a: 1 });
    });

    it("wraps AsyncStorage failures in a RepositoryError", async () => {
      jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));
      await expect(readJson("some_key", null)).rejects.toThrow(RepositoryError);
    });
  });

  describe("writeJson", () => {
    it("serializes and stores the value under the prefixed key", async () => {
      await writeJson("some_key", { b: 2 });
      const raw = await AsyncStorage.getItem("plateful:some_key");
      expect(raw).toBe(JSON.stringify({ b: 2 }));
    });

    it("wraps AsyncStorage failures in a RepositoryError", async () => {
      jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("disk full"));
      await expect(writeJson("some_key", {})).rejects.toThrow(RepositoryError);
    });
  });

  describe("removeKey", () => {
    it("removes the prefixed key from storage", async () => {
      await AsyncStorage.setItem("plateful:some_key", JSON.stringify({ c: 3 }));
      await removeKey("some_key");
      const raw = await AsyncStorage.getItem("plateful:some_key");
      expect(raw).toBeNull();
    });

    it("wraps AsyncStorage failures in a RepositoryError", async () => {
      jest
        .spyOn(AsyncStorage, "removeItem")
        .mockRejectedValueOnce(new Error("permission denied"));
      await expect(removeKey("some_key")).rejects.toThrow(RepositoryError);
    });
  });
});

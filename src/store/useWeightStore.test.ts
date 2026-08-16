import { getWeightRepository } from "@/data/repositoryProvider";
import { useWeightStore } from "@/store/useWeightStore";
import { WeightEntry } from "@/types";

jest.mock("@/data/repositoryProvider", () => ({
  getWeightRepository: jest.fn(),
}));

const mockedGetWeightRepository = getWeightRepository as jest.Mock;

function makeEntry(overrides: Partial<WeightEntry> = {}): WeightEntry {
  return {
    id: "weight_1",
    userId: "local",
    loggedAt: "2026-01-01T08:00:00.000Z",
    weightKg: 70,
    ...overrides,
  };
}

describe("useWeightStore", () => {
  let repo: {
    getEntries: jest.Mock;
    addEntry: jest.Mock;
    removeEntry: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      getEntries: jest.fn().mockResolvedValue([]),
      addEntry: jest.fn().mockResolvedValue(undefined),
      removeEntry: jest.fn().mockResolvedValue(undefined),
    };
    mockedGetWeightRepository.mockReturnValue(repo);
    useWeightStore.setState({ entries: [], isHydrated: false, hydrationError: null });
  });

  describe("addEntry", () => {
    it("rejects a non-positive weight without touching state or the repository", async () => {
      await expect(useWeightStore.getState().addEntry(0)).rejects.toThrow(
        "Weight must be a positive number."
      );
      await expect(useWeightStore.getState().addEntry(-5)).rejects.toThrow(
        "Weight must be a positive number."
      );

      expect(useWeightStore.getState().entries).toEqual([]);
      expect(repo.addEntry).not.toHaveBeenCalled();
    });

    it("rejects a non-finite weight", async () => {
      await expect(useWeightStore.getState().addEntry(NaN)).rejects.toThrow(
        "Weight must be a positive number."
      );
      await expect(useWeightStore.getState().addEntry(Infinity)).rejects.toThrow(
        "Weight must be a positive number."
      );
      expect(repo.addEntry).not.toHaveBeenCalled();
    });

    it("adds the entry optimistically and keeps it after a successful save", async () => {
      await useWeightStore.getState().addEntry(72);

      const entries = useWeightStore.getState().entries;
      expect(entries).toHaveLength(1);
      expect(entries[0].weightKg).toBe(72);
      expect(repo.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({ weightKg: 72 })
      );
    });

    it("keeps entries sorted chronologically after adding", async () => {
      useWeightStore.setState({
        entries: [makeEntry({ id: "earlier", loggedAt: "2020-01-01T00:00:00.000Z" })],
      });

      await useWeightStore.getState().addEntry(80);

      const entries = useWeightStore.getState().entries;
      expect(entries[0].id).toBe("earlier");
      expect(entries[1].weightKg).toBe(80);
    });

    it("rolls back the addition when the save rejects", async () => {
      const existing = makeEntry({ id: "existing" });
      useWeightStore.setState({ entries: [existing] });
      repo.addEntry.mockRejectedValue(new Error("offline"));

      await expect(useWeightStore.getState().addEntry(75)).rejects.toThrow("offline");

      expect(useWeightStore.getState().entries).toEqual([existing]);
    });
  });

  describe("removeEntry", () => {
    it("removes the entry optimistically and keeps it removed after success", async () => {
      const entry = makeEntry();
      useWeightStore.setState({ entries: [entry] });

      await useWeightStore.getState().removeEntry(entry.id);

      expect(useWeightStore.getState().entries).toEqual([]);
    });

    it("rolls back the removal when the save rejects", async () => {
      const entry = makeEntry();
      useWeightStore.setState({ entries: [entry] });
      repo.removeEntry.mockRejectedValue(new Error("offline"));

      await expect(useWeightStore.getState().removeEntry(entry.id)).rejects.toThrow(
        "offline"
      );

      expect(useWeightStore.getState().entries).toEqual([entry]);
    });
  });
});

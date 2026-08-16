import AsyncStorage from "@react-native-async-storage/async-storage";
import { WeightEntry } from "@/types";
import { LocalWeightRepository } from "@/data/repositories/local/localWeightRepository";

function makeEntry(overrides: Partial<WeightEntry> = {}): WeightEntry {
  return {
    id: "weight_1",
    userId: "local",
    loggedAt: "2026-01-01T08:00:00.000Z",
    weightKg: 70,
    ...overrides,
  };
}

describe("LocalWeightRepository", () => {
  let repo: LocalWeightRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    repo = new LocalWeightRepository();
  });

  it("returns an empty array when no entries exist", async () => {
    expect(await repo.getEntries()).toEqual([]);
  });

  it("adds an entry and returns it from getEntries", async () => {
    const entry = makeEntry();
    await repo.addEntry(entry);
    expect(await repo.getEntries()).toEqual([entry]);
  });

  it("returns entries sorted chronologically by loggedAt, regardless of insertion order", async () => {
    const later = makeEntry({ id: "weight_2", loggedAt: "2026-01-05T08:00:00.000Z" });
    const earlier = makeEntry({ id: "weight_1", loggedAt: "2026-01-01T08:00:00.000Z" });
    await repo.addEntry(later);
    await repo.addEntry(earlier);

    const entries = await repo.getEntries();
    expect(entries.map((e) => e.id)).toEqual(["weight_1", "weight_2"]);
  });

  it("removes an entry by id", async () => {
    const first = makeEntry({ id: "weight_1" });
    const second = makeEntry({ id: "weight_2", loggedAt: "2026-01-02T08:00:00.000Z" });
    await repo.addEntry(first);
    await repo.addEntry(second);

    await repo.removeEntry("weight_1");

    const entries = await repo.getEntries();
    expect(entries.map((e) => e.id)).toEqual(["weight_2"]);
  });
});

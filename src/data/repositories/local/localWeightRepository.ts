import { WeightEntry } from "@/types";
import { WeightRepository } from "@/data/repositories/types";
import { readJson, STORAGE_KEYS, writeJson } from "@/data/repositories/local/storage";

export class LocalWeightRepository implements WeightRepository {
  async getEntries(): Promise<WeightEntry[]> {
    const entries = await readJson<WeightEntry[]>(STORAGE_KEYS.weightEntries, []);
    return [...entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  }

  async addEntry(entry: WeightEntry): Promise<void> {
    const entries = await this.getEntries();
    await writeJson(STORAGE_KEYS.weightEntries, [...entries, entry]);
  }

  async removeEntry(id: string): Promise<void> {
    const entries = await this.getEntries();
    await writeJson(
      STORAGE_KEYS.weightEntries,
      entries.filter((e) => e.id !== id)
    );
  }
}

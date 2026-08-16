import { UserProfile } from "@/types";
import { UserRepository } from "@/data/repositories/types";
import {
  readJson,
  removeKey,
  STORAGE_KEYS,
  writeJson,
} from "@/data/repositories/local/storage";

export class LocalUserRepository implements UserRepository {
  async getProfile(): Promise<UserProfile | null> {
    return readJson<UserProfile | null>(STORAGE_KEYS.profile, null);
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await writeJson(STORAGE_KEYS.profile, profile);
  }

  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile | null> {
    const current = await this.getProfile();
    if (!current) return null;
    const updated = { ...current, ...patch };
    await this.saveProfile(updated);
    return updated;
  }

  async clearProfile(): Promise<void> {
    await removeKey(STORAGE_KEYS.profile);
  }
}

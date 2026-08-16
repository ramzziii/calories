import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile } from "@/types";
import { LocalUserRepository } from "@/data/repositories/local/localUserRepository";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user_1",
    sex: "female",
    age: 29,
    heightCm: 168,
    weightKg: 63,
    goal: "maintain",
    activityLevel: "light",
    onboardingComplete: true,
    ...overrides,
  };
}

describe("LocalUserRepository", () => {
  let repo: LocalUserRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    repo = new LocalUserRepository();
  });

  it("returns null when no profile has been saved", async () => {
    expect(await repo.getProfile()).toBeNull();
  });

  it("round-trips a saved profile", async () => {
    const profile = makeProfile();
    await repo.saveProfile(profile);
    expect(await repo.getProfile()).toEqual(profile);
  });

  it("updateProfile returns null and does not write when there is no existing profile", async () => {
    const result = await repo.updateProfile({ weightKg: 70 });
    expect(result).toBeNull();
    expect(await repo.getProfile()).toBeNull();
  });

  it("updateProfile merges the patch into the existing profile and persists it", async () => {
    await repo.saveProfile(makeProfile({ weightKg: 63 }));
    const result = await repo.updateProfile({ weightKg: 65 });
    expect(result).toEqual(makeProfile({ weightKg: 65 }));
    expect(await repo.getProfile()).toEqual(makeProfile({ weightKg: 65 }));
  });

  it("clearProfile removes the stored profile", async () => {
    await repo.saveProfile(makeProfile());
    await repo.clearProfile();
    expect(await repo.getProfile()).toBeNull();
  });
});

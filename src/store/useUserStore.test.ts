import { getUserRepository } from "@/data/repositoryProvider";
import { calculateDailyTargets } from "@/services/nutritionCalculator";
import { useUserStore } from "@/store/useUserStore";
import { UserProfile } from "@/types";

jest.mock("@/data/repositoryProvider", () => ({
  getUserRepository: jest.fn(),
}));

const mockedGetUserRepository = getUserRepository as jest.Mock;

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user_1",
    sex: "female",
    age: 29,
    heightCm: 168,
    weightKg: 60,
    goal: "maintain",
    activityLevel: "light",
    onboardingComplete: true,
    ...overrides,
  };
}

describe("useUserStore", () => {
  let repo: {
    getProfile: jest.Mock;
    saveProfile: jest.Mock;
    updateProfile: jest.Mock;
    clearProfile: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      getProfile: jest.fn(),
      saveProfile: jest.fn().mockResolvedValue(undefined),
      updateProfile: jest.fn(),
      clearProfile: jest.fn().mockResolvedValue(undefined),
    };
    mockedGetUserRepository.mockReturnValue(repo);
    useUserStore.setState({
      profile: null,
      targets: null,
      isHydrated: false,
      hydrationError: null,
    });
  });

  describe("hydrate", () => {
    it("loads the profile, derives targets, and marks the store hydrated", async () => {
      const profile = makeProfile();
      repo.getProfile.mockResolvedValue(profile);

      await useUserStore.getState().hydrate();

      const state = useUserStore.getState();
      expect(state.profile).toEqual(profile);
      expect(state.targets).toEqual(calculateDailyTargets(profile));
      expect(state.isHydrated).toBe(true);
      expect(state.hydrationError).toBeNull();
    });

    it("still marks the store hydrated when the repository read fails, recording the error", async () => {
      repo.getProfile.mockRejectedValue(new Error("disk error"));

      await useUserStore.getState().hydrate();

      const state = useUserStore.getState();
      expect(state.isHydrated).toBe(true);
      expect(state.hydrationError).toBe("disk error");
      expect(state.profile).toBeNull();
    });
  });

  describe("setProfile", () => {
    it("applies the profile optimistically and keeps it after a successful save", async () => {
      const profile = makeProfile();

      await useUserStore.getState().setProfile(profile);

      expect(useUserStore.getState().profile).toEqual(profile);
      expect(useUserStore.getState().targets).toEqual(calculateDailyTargets(profile));
      expect(repo.saveProfile).toHaveBeenCalledWith(profile);
    });

    it("rolls back to the previous profile and targets when the save rejects", async () => {
      const original = makeProfile({ weightKg: 60 });
      useUserStore.setState({
        profile: original,
        targets: calculateDailyTargets(original),
      });

      const next = makeProfile({ weightKg: 65 });
      repo.saveProfile.mockRejectedValue(new Error("network down"));

      await expect(useUserStore.getState().setProfile(next)).rejects.toThrow(
        "network down"
      );

      const state = useUserStore.getState();
      expect(state.profile).toEqual(original);
      expect(state.targets).toEqual(calculateDailyTargets(original));
    });
  });

  describe("updateProfile", () => {
    it("does nothing when there is no current profile", async () => {
      await useUserStore.getState().updateProfile({ weightKg: 70 });

      expect(useUserStore.getState().profile).toBeNull();
      expect(repo.saveProfile).not.toHaveBeenCalled();
    });

    it("merges the patch optimistically and persists it on success", async () => {
      const original = makeProfile({ weightKg: 60 });
      useUserStore.setState({
        profile: original,
        targets: calculateDailyTargets(original),
      });

      await useUserStore.getState().updateProfile({ weightKg: 62 });

      const expected = { ...original, weightKg: 62 };
      expect(useUserStore.getState().profile).toEqual(expected);
      expect(repo.saveProfile).toHaveBeenCalledWith(expected);
    });

    it("rolls back the merged patch when the save rejects", async () => {
      const original = makeProfile({ weightKg: 60 });
      useUserStore.setState({
        profile: original,
        targets: calculateDailyTargets(original),
      });
      repo.saveProfile.mockRejectedValue(new Error("save failed"));

      await expect(
        useUserStore.getState().updateProfile({ weightKg: 62 })
      ).rejects.toThrow("save failed");

      const state = useUserStore.getState();
      expect(state.profile).toEqual(original);
      expect(state.targets).toEqual(calculateDailyTargets(original));
    });
  });

  describe("reset", () => {
    it("clears the profile and targets, and clears the repository", async () => {
      const profile = makeProfile();
      useUserStore.setState({ profile, targets: calculateDailyTargets(profile) });

      await useUserStore.getState().reset();

      expect(useUserStore.getState().profile).toBeNull();
      expect(useUserStore.getState().targets).toBeNull();
      expect(repo.clearProfile).toHaveBeenCalled();
    });
  });
});

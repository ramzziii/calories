import { supabase } from "@/services/supabase";
import { UserProfile } from "@/types";
import { RepositoryError, UserRepository } from "@/data/repositories/types";

/**
 * Supabase-backed implementation, written against supabase/schema.sql.
 *
 * NOT YET ACTIVE — see repositoryProvider.ts, which currently points at
 * the Local* implementations. This class assumes an authenticated
 * Supabase session exists (auth.uid() is used by RLS policies); wiring
 * real sign-in/sign-up screens is a prerequisite for switching to this
 * implementation, tracked as a follow-up.
 */
export class SupabaseUserRepository implements UserRepository {
  async getProfile(): Promise<UserProfile | null> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (error) throw new RepositoryError("Failed to fetch profile", error);
    if (!data) return null;

    return {
      id: data.id,
      email: auth.user.email ?? undefined,
      sex: data.sex,
      age: data.age,
      heightCm: data.height_cm,
      weightKg: data.weight_kg,
      goal: data.goal,
      activityLevel: data.activity_level,
      onboardingComplete: data.onboarding_complete,
    };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const { error } = await supabase.from("profiles").upsert({
      id: profile.id,
      sex: profile.sex,
      age: profile.age,
      height_cm: profile.heightCm,
      weight_kg: profile.weightKg,
      goal: profile.goal,
      activity_level: profile.activityLevel,
      onboarding_complete: profile.onboardingComplete,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new RepositoryError("Failed to save profile", error);
  }

  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile | null> {
    const current = await this.getProfile();
    if (!current) return null;
    const updated = { ...current, ...patch };
    await this.saveProfile(updated);
    return updated;
  }

  async clearProfile(): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("profiles").delete().eq("id", auth.user.id);
    if (error) throw new RepositoryError("Failed to clear profile", error);
  }
}

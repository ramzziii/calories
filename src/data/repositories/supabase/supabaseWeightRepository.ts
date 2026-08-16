import { supabase } from "@/services/supabase";
import { WeightEntry } from "@/types";
import { RepositoryError, WeightRepository } from "@/data/repositories/types";

/** NOT YET ACTIVE — see the note in supabaseUserRepository.ts. */
export class SupabaseWeightRepository implements WeightRepository {
  async getEntries(): Promise<WeightEntry[]> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await supabase
      .from("weight_entries")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("logged_at", { ascending: true });

    if (error) throw new RepositoryError("Failed to fetch weight entries", error);

    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      loggedAt: row.logged_at,
      weightKg: row.weight_kg,
    }));
  }

  async addEntry(entry: WeightEntry): Promise<void> {
    const { error } = await supabase.from("weight_entries").insert({
      id: entry.id,
      user_id: entry.userId,
      logged_at: entry.loggedAt,
      weight_kg: entry.weightKg,
    });
    if (error) throw new RepositoryError("Failed to add weight entry", error);
  }

  async removeEntry(id: string): Promise<void> {
    const { error } = await supabase.from("weight_entries").delete().eq("id", id);
    if (error) throw new RepositoryError("Failed to remove weight entry", error);
  }
}

import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Set these in .env (gitignored — see .env.example for the expected
// shape). The EXPO_PUBLIC_ prefix is required for Expo to inline them
// into the client bundle; anything without that prefix stays server-only
// and would be undefined here. This is the anon/publishable key, which
// is designed to be shipped in a client app — it's scoped by Row Level
// Security, not secrecy. True secrets (like the OpenAI key) never go in
// this file — they live only as a Supabase Edge Function secret.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "YOUR-SUPABASE-ANON-KEY";

export const isSupabaseConfigured =
  SUPABASE_URL !== "https://YOUR-PROJECT.supabase.co" &&
  SUPABASE_ANON_KEY !== "YOUR-SUPABASE-ANON-KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

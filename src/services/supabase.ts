import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Set these in app.json under "expo.extra", or in a .env file loaded via
// babel-plugin-dotenv-import / expo-constants. Never commit real keys.
const SUPABASE_URL =
  (Constants.expoConfig?.extra?.supabaseUrl as string) ||
  "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string) || "YOUR-SUPABASE-ANON-KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

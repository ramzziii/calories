// Google / Apple sign-in via Supabase's OAuth browser-redirect flow.
//
// Deliberately NOT using native SDKs (@react-native-google-signin,
// expo-apple-authentication) — those need a custom dev build, same as
// react-native-purchases and the HealthKit/Health Connect integrations
// elsewhere in this app. This flow uses only expo-web-browser and
// expo-linking, both bundled in Expo Go, so sign-in is testable without
// a dev build once Google/Apple OAuth credentials are configured in the
// Supabase dashboard (see AUTH_BILLING_SETUP.md). A native Apple/Google
// button can replace this later for a more polished look, once a dev
// build exists — this is the pragmatic starting point, not a permanent
// ceiling.
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

// Required once per app lifetime so the browser session correctly
// resolves back to the app on iOS/Android after the redirect.
WebBrowser.maybeCompleteAuthSession();

const REDIRECT_TO = Linking.createURL("auth-callback");

export type OAuthProvider = "google" | "apple";

export class SignInCanceledError extends Error {
  constructor() {
    super("Sign-in was canceled.");
    this.name = "SignInCanceledError";
  }
}

async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: REDIRECT_TO,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) {
    throw new Error("Couldn't start sign-in — no authorization URL returned.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_TO);

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new SignInCanceledError();
  }
  if (result.type !== "success" || !result.url) {
    throw new Error("Sign-in didn't complete. Please try again.");
  }

  const { queryParams } = Linking.parse(result.url);
  const errorDescription = queryParams?.error_description;
  if (typeof errorDescription === "string") {
    throw new Error(errorDescription);
  }

  const code = queryParams?.code;
  if (typeof code !== "string") {
    throw new Error("Sign-in didn't complete. Please try again.");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

export function signInWithGoogle(): Promise<void> {
  return signInWithProvider("google");
}

export function signInWithApple(): Promise<void> {
  return signInWithProvider("apple");
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase";
import {
  signInWithApple as signInWithAppleService,
  signInWithGoogle as signInWithGoogleService,
  signOut as signOutService,
  SignInCanceledError,
} from "@/services/auth";

export type SubscriptionStatus = "none" | "active" | "canceled" | "expired";

interface AuthState {
  session: Session | null;
  user: User | null;
  trialStartedAt: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriodEnd: string | null;
  isHydrated: boolean;
  isSigningIn: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Registered once per app lifetime (not per-store-instance re-hydrate),
// since Supabase's client itself is a module-level singleton.
let listenerRegistered = false;

async function loadAccountAndSubscription(userId: string) {
  const [{ data: account }, { data: subscription }] = await Promise.all([
    supabase.from("accounts").select("trial_started_at").eq("id", userId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  return {
    trialStartedAt: account?.trial_started_at ?? null,
    subscriptionStatus:
      (subscription?.status as SubscriptionStatus | undefined) ?? "none",
    subscriptionPeriodEnd: subscription?.current_period_end ?? null,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  trialStartedAt: null,
  subscriptionStatus: "none",
  subscriptionPeriodEnd: null,
  isHydrated: false,
  isSigningIn: false,
  error: null,

  hydrate: async () => {
    if (!listenerRegistered) {
      listenerRegistered = true;
      // Fires on sign-in, sign-out, and token refresh — keeps the store
      // (and therefore navigation gating) correct even for events that
      // don't originate from this store's own methods, e.g. a refresh
      // token finally expiring in the background.
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const extra = await loadAccountAndSubscription(session.user.id);
          set({ session, user: session.user, ...extra });
        } else {
          set({
            session: null,
            user: null,
            trialStartedAt: null,
            subscriptionStatus: "none",
            subscriptionPeriodEnd: null,
          });
        }
      });
    }

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.user) {
        const extra = await loadAccountAndSubscription(session.user.id);
        set({ session, user: session.user, ...extra, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch (err) {
      set({
        isHydrated: true,
        error: err instanceof Error ? err.message : "Failed to check sign-in status.",
      });
    }
  },

  signInWithGoogle: async () => {
    set({ isSigningIn: true, error: null });
    try {
      await signInWithGoogleService();
      // onAuthStateChange (registered above) updates session/user/trial
      // once the exchange completes — nothing further to set here.
    } catch (err) {
      if (!(err instanceof SignInCanceledError)) {
        set({ error: err instanceof Error ? err.message : "Sign-in failed." });
      }
    } finally {
      set({ isSigningIn: false });
    }
  },

  signInWithApple: async () => {
    set({ isSigningIn: true, error: null });
    try {
      await signInWithAppleService();
    } catch (err) {
      if (!(err instanceof SignInCanceledError)) {
        set({ error: err instanceof Error ? err.message : "Sign-in failed." });
      }
    } finally {
      set({ isSigningIn: false });
    }
  },

  signOut: async () => {
    try {
      await signOutService();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Sign-out failed." });
    }
  },

  clearError: () => set({ error: null }),
}));

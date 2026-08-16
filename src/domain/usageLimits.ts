// Client-side mirror of the trial/cap rules enforced authoritatively in
// supabase/functions/analyze-meal/index.ts (checkAndConsumeQuota). This
// copy is for display only — "X days left," "you've used N/15 today" —
// never for enforcement, since a client can't be trusted to gate itself.

export const TRIAL_DAYS = 7;
export const TRIAL_DAILY_CAP = 15;
export const PAID_DAILY_CAP = 50;

export type SubscriptionStatus = "none" | "active" | "canceled" | "expired";

export interface EntitlementInput {
  trialStartedAt: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriodEnd: string | null;
}

export function daysSinceTrialStart(
  trialStartedAt: string,
  now: Date = new Date()
): number {
  return (now.getTime() - new Date(trialStartedAt).getTime()) / 86_400_000;
}

export function isTrialExpired(trialStartedAt: string, now: Date = new Date()): boolean {
  return daysSinceTrialStart(trialStartedAt, now) >= TRIAL_DAYS;
}

// Whole days remaining, floored at 0 — "0 days left" still means today
// is usable; isTrialExpired is the source of truth for whether it's over.
export function daysLeftInTrial(trialStartedAt: string, now: Date = new Date()): number {
  const remaining = TRIAL_DAYS - daysSinceTrialStart(trialStartedAt, now);
  return Math.max(0, Math.ceil(remaining));
}

// "canceled" means auto-renew is off, not that access has ended — RevenueCat
// keeps reporting the subscriber as entitled until subscriptionPeriodEnd.
export function isCurrentlyPaid(
  input: EntitlementInput,
  now: Date = new Date()
): boolean {
  if (input.subscriptionStatus === "active") return true;
  if (input.subscriptionStatus === "canceled" && input.subscriptionPeriodEnd) {
    return new Date(input.subscriptionPeriodEnd).getTime() > now.getTime();
  }
  return false;
}

// 0 means blocked entirely (trial expired, not subscribed).
export function getDailyCap(input: EntitlementInput, now: Date = new Date()): number {
  if (isCurrentlyPaid(input, now)) return PAID_DAILY_CAP;
  if (!input.trialStartedAt) return TRIAL_DAILY_CAP;
  return isTrialExpired(input.trialStartedAt, now) ? 0 : TRIAL_DAILY_CAP;
}

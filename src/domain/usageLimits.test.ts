import {
  TRIAL_DAYS,
  TRIAL_DAILY_CAP,
  PAID_DAILY_CAP,
  daysSinceTrialStart,
  isTrialExpired,
  daysLeftInTrial,
  isCurrentlyPaid,
  getDailyCap,
  EntitlementInput,
} from "./usageLimits";

const NOW = new Date("2026-08-16T12:00:00.000Z");

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString();
}

function daysFromNow(n: number): string {
  return new Date(NOW.getTime() + n * 86_400_000).toISOString();
}

describe("daysSinceTrialStart", () => {
  it("returns 0 for a trial that just started", () => {
    expect(daysSinceTrialStart(NOW.toISOString(), NOW)).toBe(0);
  });

  it("returns fractional days for a partial day elapsed", () => {
    expect(daysSinceTrialStart(daysAgo(2.5), NOW)).toBeCloseTo(2.5, 5);
  });
});

describe("isTrialExpired", () => {
  it("is not expired on day 0", () => {
    expect(isTrialExpired(NOW.toISOString(), NOW)).toBe(false);
  });

  it("is not expired just under the boundary", () => {
    expect(isTrialExpired(daysAgo(TRIAL_DAYS - 0.01), NOW)).toBe(false);
  });

  it("is expired exactly at the boundary", () => {
    expect(isTrialExpired(daysAgo(TRIAL_DAYS), NOW)).toBe(true);
  });

  it("is expired well past the boundary", () => {
    expect(isTrialExpired(daysAgo(TRIAL_DAYS + 10), NOW)).toBe(true);
  });
});

describe("daysLeftInTrial", () => {
  it("shows the full trial length on day 0", () => {
    expect(daysLeftInTrial(NOW.toISOString(), NOW)).toBe(TRIAL_DAYS);
  });

  it("counts down as days pass", () => {
    expect(daysLeftInTrial(daysAgo(3), NOW)).toBe(TRIAL_DAYS - 3);
  });

  it("floors at 0 rather than going negative", () => {
    expect(daysLeftInTrial(daysAgo(TRIAL_DAYS + 5), NOW)).toBe(0);
  });
});

describe("isCurrentlyPaid", () => {
  const base: EntitlementInput = {
    trialStartedAt: null,
    subscriptionStatus: "none",
    subscriptionPeriodEnd: null,
  };

  it("is paid when status is active", () => {
    expect(isCurrentlyPaid({ ...base, subscriptionStatus: "active" }, NOW)).toBe(true);
  });

  it("is not paid when status is none", () => {
    expect(isCurrentlyPaid(base, NOW)).toBe(false);
  });

  it("is not paid when expired", () => {
    expect(isCurrentlyPaid({ ...base, subscriptionStatus: "expired" }, NOW)).toBe(false);
  });

  it("is still paid when canceled but current_period_end is in the future", () => {
    expect(
      isCurrentlyPaid(
        {
          ...base,
          subscriptionStatus: "canceled",
          subscriptionPeriodEnd: daysFromNow(5),
        },
        NOW
      )
    ).toBe(true);
  });

  it("is not paid when canceled and current_period_end has already passed", () => {
    expect(
      isCurrentlyPaid(
        {
          ...base,
          subscriptionStatus: "canceled",
          subscriptionPeriodEnd: daysAgo(1),
        },
        NOW
      )
    ).toBe(false);
  });

  it("is not paid when canceled with no period end on record", () => {
    expect(
      isCurrentlyPaid(
        { ...base, subscriptionStatus: "canceled", subscriptionPeriodEnd: null },
        NOW
      )
    ).toBe(false);
  });
});

describe("getDailyCap", () => {
  const base: EntitlementInput = {
    trialStartedAt: null,
    subscriptionStatus: "none",
    subscriptionPeriodEnd: null,
  };

  it("gives the paid cap to an active subscriber", () => {
    expect(getDailyCap({ ...base, subscriptionStatus: "active" }, NOW)).toBe(
      PAID_DAILY_CAP
    );
  });

  it("gives the trial cap during an active trial", () => {
    expect(getDailyCap({ ...base, trialStartedAt: daysAgo(2) }, NOW)).toBe(
      TRIAL_DAILY_CAP
    );
  });

  it("gives zero once the trial has expired and there's no subscription", () => {
    expect(getDailyCap({ ...base, trialStartedAt: daysAgo(TRIAL_DAYS + 1) }, NOW)).toBe(
      0
    );
  });

  it("falls back to the trial cap when there's no account row yet", () => {
    expect(getDailyCap(base, NOW)).toBe(TRIAL_DAILY_CAP);
  });

  it("gives the paid cap to a canceled-but-still-in-period subscriber even past trial", () => {
    expect(
      getDailyCap(
        {
          trialStartedAt: daysAgo(TRIAL_DAYS + 30),
          subscriptionStatus: "canceled",
          subscriptionPeriodEnd: daysFromNow(3),
        },
        NOW
      )
    ).toBe(PAID_DAILY_CAP);
  });
});

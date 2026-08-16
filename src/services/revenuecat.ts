import { Platform, Linking } from "react-native";
import Purchases, { CustomerInfo, PurchasesOffering } from "react-native-purchases";
import { SubscriptionInfo } from "@/types";

// Replace with your real RevenueCat public SDK keys once you have an
// account (dashboard.revenuecat.com). Safe to leave as placeholders —
// calls will simply fail gracefully until then.
const REVENUECAT_API_KEYS = {
  ios: "appl_YOUR_IOS_KEY",
  android: "goog_YOUR_ANDROID_KEY",
};

let initialized = false;

export function initRevenueCat(userId?: string) {
  if (initialized) return;
  const apiKey =
    Platform.OS === "ios" ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;

  Purchases.configure({ apiKey, appUserID: userId });
  initialized = true;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (err) {
    console.error("Failed to fetch RevenueCat offerings:", err);
    return null;
  }
}

// Purchases a package. IMPORTANT: whichever package is presented in the
// paywall UI must clearly show trial length and post-trial price BEFORE
// this is called — see PaywallScreen.tsx.
export async function purchasePackage(packageIdentifier: string) {
  const offering = await getCurrentOffering();
  const pkg = offering?.availablePackages.find((p) => p.identifier === packageIdentifier);
  if (!pkg) throw new Error("Selected plan is not available right now.");

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfoToSubscriptionInfo(customerInfo);
}

export async function restorePurchases(): Promise<SubscriptionInfo> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfoToSubscriptionInfo(customerInfo);
}

export async function getSubscriptionStatus(): Promise<SubscriptionInfo> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfoToSubscriptionInfo(customerInfo);
  } catch (err) {
    console.error("Failed to fetch subscription status:", err);
    return { status: "none" };
  }
}

function customerInfoToSubscriptionInfo(customerInfo: CustomerInfo): SubscriptionInfo {
  const entitlement = customerInfo.entitlements.active["premium"];

  if (!entitlement) {
    return { status: "none", managementUrl: getManagementUrl() };
  }

  const isTrial = entitlement.periodType === "TRIAL";

  return {
    status: isTrial ? "trial" : "active",
    trialEndsAt: isTrial ? (entitlement.expirationDate ?? undefined) : undefined,
    renewsAt: entitlement.expirationDate ?? undefined,
    productId: entitlement.productIdentifier,
    managementUrl: getManagementUrl(),
  };
}

// One-tap deep link straight to native subscription management —
// this is what users repeatedly asked for and didn't get in TrackAI-style
// apps: no "email us to cancel," just the OS subscription screen.
export function getManagementUrl(): string {
  return Platform.OS === "ios"
    ? "https://apps.apple.com/account/subscriptions"
    : "https://play.google.com/store/account/subscriptions";
}

export async function openSubscriptionManagement() {
  const url = getManagementUrl();
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    throw new Error("Couldn't open subscription settings.");
  }
}

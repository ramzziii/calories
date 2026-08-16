// Supabase Edge Function: receives RevenueCat webhook events and keeps
// public.subscriptions in sync — this is what makes a user's paid
// status trustworthy server-side (analyze-meal reads this table, never
// anything the client reports about itself).
//
// Setup (see AUTH_BILLING_SETUP.md):
//   supabase secrets set REVENUECAT_WEBHOOK_SECRET=<a random string you pick>
//   supabase functions deploy revenuecat-webhook
// Then in the RevenueCat dashboard: Project Settings > Integrations >
// Webhooks — set the URL to this function's URL, and set "Authorization
// header value" to `Bearer <the same random string>`.
//
// RevenueCat webhook event types: https://www.revenuecat.com/docs/webhooks

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

const JSON_HEADERS = { "Content-Type": "application/json" };

// Product identifiers are whatever you name them in App Store Connect /
// Google Play Console + RevenueCat — this just needs to agree with
// whatever convention you pick. Falls back to null (unknown plan) if a
// product id doesn't match, which still records the subscription as
// active, just without a labeled plan.
function planFromProductId(
  productId: string | undefined
): "weekly" | "monthly" | "yearly" | null {
  if (!productId) return null;
  const id = productId.toLowerCase();
  if (id.includes("week")) return "weekly";
  if (id.includes("month")) return "monthly";
  if (id.includes("year") || id.includes("annual")) return "yearly";
  return null;
}

const ACTIVE_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
]);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  if (!REVENUECAT_WEBHOOK_SECRET) {
    console.error("REVENUECAT_WEBHOOK_SECRET is not configured on the server.");
    return new Response(JSON.stringify({ error: "Webhook not configured." }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
    return new Response(JSON.stringify({ error: "Invalid webhook credentials." }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Request body must be JSON." }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const event = body?.event;
  const appUserId: string | undefined = event?.app_user_id;
  const type: string | undefined = event?.type;

  if (!appUserId || !type) {
    return new Response(JSON.stringify({ error: "Malformed webhook payload." }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (type === "EXPIRATION") {
      const { error } = await admin
        .from("subscriptions")
        .upsert(
          { user_id: appUserId, status: "expired", updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    } else if (type === "CANCELLATION") {
      // Auto-renew turned off, but access continues until
      // current_period_end (already stored from the last active event)
      // — analyze-meal treats "canceled but not yet past period end" as
      // still paid.
      const { error } = await admin
        .from("subscriptions")
        .upsert(
          {
            user_id: appUserId,
            status: "canceled",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    } else if (ACTIVE_EVENT_TYPES.has(type)) {
      const productId: string | undefined = event?.product_id;
      const expirationMs: number | undefined = event?.expiration_at_ms;
      const { error } = await admin.from("subscriptions").upsert(
        {
          user_id: appUserId,
          status: "active",
          plan: planFromProductId(productId),
          current_period_end: expirationMs ? new Date(expirationMs).toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    }
    // Other event types (BILLING_ISSUE, TRANSFER, SUBSCRIBER_ALIAS, TEST, ...)
    // are acknowledged but don't change subscription state.

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err) {
    console.error("revenuecat-webhook error:", err);
    return new Response(JSON.stringify({ error: "Failed to process webhook." }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});

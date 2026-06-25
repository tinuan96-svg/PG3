import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ─── OneSignal REST API helper ────────────────────────────────────────────────

async function sendOneSignalNotification(
  payload: Record<string, unknown>,
): Promise<{ id?: string; recipients?: number; errors?: unknown }> {
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({ app_id: ONESIGNAL_APP_ID, ...payload }),
  });
  return res.json();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Register device ───────────────────────────────────────────────────────
    if (action === "register") {
      const { user_id, player_id, device_type, platform } = body;
      if (!user_id || !player_id) {
        return json({ error: "user_id and player_id required" }, 400);
      }
      await db.from("push_subscriptions").upsert(
        {
          user_id,
          onesignal_player_id: player_id,
          device_type: device_type || "web",
          platform: platform || "chrome",
          last_active: new Date().toISOString(),
        },
        { onConflict: "onesignal_player_id" },
      );
      return json({ success: true });
    }

    // ── Send to a specific user ───────────────────────────────────────────────
    // Uses OneSignal external_id = Supabase auth.uid()
    if (action === "send_to_user") {
      const { user_id, title, message, url, data, image_url } = body;
      if (!user_id || !title || !message) {
        return json({ error: "user_id, title, message required" }, 400);
      }

      const payload: Record<string, unknown> = {
        include_external_user_ids: [user_id],
        target_channel: "push",
        headings: { en: title },
        contents: { en: message },
      };
      if (url) { payload.url = url; payload.web_url = url; payload.app_url = url; }
      if (data) payload.data = data;
      if (image_url) {
        payload.big_picture = image_url;
        payload.chrome_big_picture = image_url;
      }

      const result = await sendOneSignalNotification(payload);

      // Log to notification_campaigns
      await db.from("notification_campaigns").insert({
        title,
        message,
        image_url: image_url || "",
        landing_url: url || "",
        segment: `user:${user_id}`,
        status: result.errors ? "failed" : "sent",
        onesignal_notification_id: result.id || "",
        sent_count: result.recipients || 1,
        sent_at: new Date().toISOString(),
      });

      return json(result);
    }

    // ── Send campaign to a segment ────────────────────────────────────────────
    if (action === "send_campaign") {
      const { title, message, segment, url, image_url, created_by } = body;
      if (!title || !message) {
        return json({ error: "title and message required" }, 400);
      }

      const payload: Record<string, unknown> = {
        included_segments: [segment || "All"],
        headings: { en: title },
        contents: { en: message },
      };
      if (url) { payload.url = url; payload.web_url = url; }
      if (image_url) {
        payload.big_picture = image_url;
        payload.chrome_big_picture = image_url;
      }

      const result = await sendOneSignalNotification(payload);

      await db.from("notification_campaigns").insert({
        title,
        message,
        image_url: image_url || "",
        landing_url: url || "",
        segment: segment || "All",
        status: result.errors ? "failed" : "sent",
        onesignal_notification_id: result.id || "",
        sent_count: result.recipients || 0,
        sent_at: new Date().toISOString(),
        created_by: created_by || null,
      });

      return json(result);
    }

    // ── Schedule campaign ─────────────────────────────────────────────────────
    if (action === "schedule_campaign") {
      const { title, message, segment, url, image_url, scheduled_at, created_by } = body;
      if (!title || !message || !scheduled_at) {
        return json({ error: "title, message, scheduled_at required" }, 400);
      }

      const payload: Record<string, unknown> = {
        included_segments: [segment || "All"],
        headings: { en: title },
        contents: { en: message },
        send_after: scheduled_at,
      };
      if (url) payload.url = url;
      if (image_url) payload.big_picture = image_url;

      const result = await sendOneSignalNotification(payload);

      await db.from("notification_campaigns").insert({
        title,
        message,
        image_url: image_url || "",
        landing_url: url || "",
        segment: segment || "All",
        status: result.errors ? "failed" : "scheduled",
        onesignal_notification_id: result.id || "",
        scheduled_at,
        created_by: created_by || null,
      });

      return json(result);
    }

    // ── Get dashboard stats ───────────────────────────────────────────────────
    if (action === "get_stats") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [subResult, campaignResult, last30Result] = await Promise.all([
        db.from("push_subscriptions").select("id", { count: "exact", head: true }),
        db.from("notification_campaigns")
          .select("sent_count, delivered_count, opened_count")
          .gte("sent_at", todayStart.toISOString()),
        db.from("notification_campaigns")
          .select("sent_count, delivered_count, opened_count")
          .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
      ]);

      const today = campaignResult.data ?? [];
      const last30 = last30Result.data ?? [];

      const sum = (arr: { sent_count?: number; opened_count?: number; delivered_count?: number }[], key: keyof typeof arr[0]) =>
        arr.reduce((s, r) => s + ((r[key] as number) || 0), 0);

      const sentToday = sum(today, "sent_count");
      const delivered30 = sum(last30, "delivered_count");
      const opened30 = sum(last30, "opened_count");
      const sent30 = sum(last30, "sent_count");

      return json({
        subscribers: subResult.count ?? 0,
        sent_today: sentToday,
        open_rate: delivered30 > 0 ? Math.round((opened30 / delivered30) * 100) : 0,
        ctr: sent30 > 0 ? Math.round((opened30 / sent30) * 100) : 0,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

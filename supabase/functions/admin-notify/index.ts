import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  delivery_address?: string;
  delivery_city?: string;
  delivery_postcode?: string;
  notes?: string;
  payment_method?: string;
  created_at: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

// ─── Dedup check ─────────────────────────────────────────────────────────────

async function alreadySent(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  type: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("admin_notifications")
    .select("id")
    .eq("order_id", orderId)
    .eq("type", type)
    .maybeSingle();
  return !!data;
}

async function logNotification(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  type: string,
  recipient: string,
  status: "sent" | "failed" | "skipped",
  error?: string,
  response?: unknown,
) {
  await supabase
    .from("admin_notifications")
    .upsert(
      {
        order_id: orderId,
        type,
        recipient,
        status,
        error_message: error ?? null,
        response: response ?? null,
        sent_at: new Date().toISOString(),
      },
      { onConflict: "order_id,type", ignoreDuplicates: false },
    )
    .maybeSingle();
}

// ─── Push via OneSignal ───────────────────────────────────────────────────────

async function sendAdminPush(
  order: OrderDetails,
  onesignalAppId: string,
  onesignalRestKey: string,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const total = (order.total / 100).toFixed(2);
  const body = {
    app_id: onesignalAppId,
    // Send to all admin-tagged users
    filters: [{ field: "tag", key: "role", relation: "=", value: "admin" }],
    headings: { en: "New Paid Order Received" },
    contents: {
      en: `Order #${order.order_number}\nCustomer: ${order.customer_name}\nAmount: £${total}\nPayment Confirmed`,
    },
    url: `/admin/orders`,
    web_url: `/admin/orders`,
    app_url: `/admin/orders`,
    data: { order_id: order.id, order_number: order.order_number },
    priority: 10,
  };

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${onesignalRestKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.errors) {
    return { ok: false, error: JSON.stringify(data.errors ?? data), data };
  }
  return { ok: true, data };
}

// ─── Email via SendGrid ───────────────────────────────────────────────────────

function buildOrderEmailHtml(order: OrderDetails, items: OrderItem[], siteUrl: string): string {
  const total = (order.total / 100).toFixed(2);
  const orderUrl = `${siteUrl}/admin/orders`;
  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;">${i.product_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:center;">${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:right;">£${(i.unit_price * i.quantity / 100).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#0F2747;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">New Paid Order</h1>
      <p style="margin:6px 0 0;color:#5FAE9B;font-size:14px;">Order #${order.order_number} — Payment Confirmed</p>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;width:140px;">Customer</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${order.customer_name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;">Email</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;">${order.customer_email}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;">Order Total</td>
          <td style="padding:8px 0;font-size:22px;color:#0F2747;font-weight:700;">£${total}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;">Payment</td>
          <td style="padding:8px 0;font-size:14px;color:#16a34a;font-weight:600;">${order.payment_method ?? "Card"} — Confirmed</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;">Delivery To</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;">${[order.delivery_address, order.delivery_city, order.delivery_postcode].filter(Boolean).join(", ") || "—"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;">Order Date</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;">${new Date(order.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
        </tr>
        ${order.notes ? `<tr><td style="padding:8px 0;font-size:13px;color:#6b7280;">Notes</td><td style="padding:8px 0;font-size:14px;color:#111827;">${order.notes}</td></tr>` : ""}
      </table>

      ${items.length > 0 ? `
      <h3 style="font-size:14px;font-weight:600;color:#374151;margin:0 0 8px;">Ordered Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f9fafb;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">Product</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>` : ""}

      <a href="${orderUrl}" style="display:inline-block;background:#0F2747;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:600;">
        View Order in Admin
      </a>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">PocketGrocery Admin Notification — Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendAdminEmail(
  order: OrderDetails,
  items: OrderItem[],
  toEmail: string,
  sendgridKey: string,
  fromEmail: string,
  siteUrl: string,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const total = (order.total / 100).toFixed(2);
  const html = buildOrderEmailHtml(order, items, siteUrl);

  const body = {
    personalizations: [{ to: [{ email: toEmail }] }],
    from: { email: fromEmail, name: "PocketGrocery Admin" },
    subject: `New Paid Order #${order.order_number} — £${total}`,
    content: [{ type: "text/html", value: html }],
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sendgridKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    return { ok: false, error: err };
  }
  return { ok: true };
}

// ─── WhatsApp via Twilio ──────────────────────────────────────────────────────

async function sendAdminWhatsApp(
  order: OrderDetails,
  toPhone: string,
  twilioSid: string,
  twilioToken: string,
  fromWhatsApp: string,
  siteUrl: string,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const total = (order.total / 100).toFixed(2);
  const itemCount = order.total; // will be overridden
  const orderUrl = `${siteUrl}/admin/orders`;

  const message = `🛒 New Paid Order\nOrder: #${order.order_number}\nCustomer: ${order.customer_name}\nTotal: £${total}\nPayment: Confirmed\nView: ${orderUrl}`;

  const from = fromWhatsApp.startsWith("whatsapp:") ? fromWhatsApp : `whatsapp:${fromWhatsApp}`;
  const to = toPhone.startsWith("whatsapp:") ? toPhone : `whatsapp:${toPhone}`;

  const params = new URLSearchParams({ From: from, To: to, Body: message });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
      },
      body: params.toString(),
    },
  );

  const data = await res.json();
  if (!res.ok || data.error_code) {
    return { ok: false, error: data.message ?? JSON.stringify(data), data };
  }
  return { ok: true, data };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Fetch order with items
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, total, delivery_address, delivery_city, delivery_postcode, notes, payment_status, order_status, created_at")
      .eq("id", order_id)
      .maybeSingle();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Only notify for paid orders — hard guard
    if (order.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ skipped: true, reason: `payment_status=${order.payment_status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: itemRows } = await supabase
      .from("order_items")
      .select("product_name, quantity, unit_price")
      .eq("order_id", order_id);

    const items: OrderItem[] = (itemRows ?? []) as OrderItem[];

    // Load admin notification settings
    const { data: ns } = await supabase
      .from("admin_notification_settings")
      .select("admin_email, admin_whatsapp, push_enabled, email_enabled, whatsapp_enabled")
      .eq("id", "00000000-0000-0000-0000-000000000088")
      .maybeSingle();

    const settings = {
      admin_email: ns?.admin_email ?? Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "",
      admin_whatsapp: ns?.admin_whatsapp ?? Deno.env.get("ADMIN_NOTIFY_WHATSAPP") ?? "",
      push_enabled: ns?.push_enabled ?? true,
      email_enabled: ns?.email_enabled ?? true,
      whatsapp_enabled: ns?.whatsapp_enabled ?? false,
    };

    const onesignalAppId = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
    const onesignalRestKey = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";
    const sendgridKey = Deno.env.get("SENDGRID_API_KEY") ?? "";
    const fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") ?? "admin@pocketgrocery.com";
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
    const fromWhatsApp = Deno.env.get("TWILIO_WHATSAPP_NUMBER") ?? "";
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://pocketgrocery.com";

    const results: Record<string, string> = {};

    // ── Push ─────────────────────────────────────────────────────────────────
    if (settings.push_enabled && onesignalAppId && onesignalRestKey) {
      if (await alreadySent(supabase, order_id, "push")) {
        results.push = "duplicate_skipped";
      } else {
        const r = await sendAdminPush(order as OrderDetails, onesignalAppId, onesignalRestKey);
        await logNotification(supabase, order_id, "push", "admin_users", r.ok ? "sent" : "failed", r.error, r.data);
        results.push = r.ok ? "sent" : `failed: ${r.error}`;
      }
    } else {
      results.push = "skipped";
    }

    // ── Email ────────────────────────────────────────────────────────────────
    if (settings.email_enabled && settings.admin_email && sendgridKey) {
      if (await alreadySent(supabase, order_id, "email")) {
        results.email = "duplicate_skipped";
      } else {
        const r = await sendAdminEmail(order as OrderDetails, items, settings.admin_email, sendgridKey, fromEmail, siteUrl);
        await logNotification(supabase, order_id, "email", settings.admin_email, r.ok ? "sent" : "failed", r.error, r.data);
        results.email = r.ok ? "sent" : `failed: ${r.error}`;
      }
    } else {
      results.email = "skipped";
    }

    // ── WhatsApp ──────────────────────────────────────────────────────────────
    if (settings.whatsapp_enabled && settings.admin_whatsapp && twilioSid && twilioToken) {
      if (await alreadySent(supabase, order_id, "whatsapp")) {
        results.whatsapp = "duplicate_skipped";
      } else {
        const r = await sendAdminWhatsApp(order as OrderDetails, settings.admin_whatsapp, twilioSid, twilioToken, fromWhatsApp, siteUrl);
        await logNotification(supabase, order_id, "whatsapp", settings.admin_whatsapp, r.ok ? "sent" : "failed", r.error, r.data);
        results.whatsapp = r.ok ? "sent" : `failed: ${r.error}`;
      }
    } else {
      results.whatsapp = "skipped";
    }

    return new Response(
      JSON.stringify({ ok: true, order_id, order_number: order.order_number, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-notify] error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

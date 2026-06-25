import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── HMAC-SHA256 signature validation ─────────────────────────────────────────

async function verifyWorldpaySignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  if (!secret || !signatureHeader) return !secret; // Skip if no secret configured

  // Worldpay sends: "HMAC-SHA256 signature=<base64>"
  const match = signatureHeader.match(/signature=([A-Za-z0-9+/=]+)/);
  const receivedSig = match?.[1];
  if (!receivedSig) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(rawBody);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
  const computedSig = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer)),
  );

  return computedSig === receivedSig;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Load webhook secret from DB settings
    const { data: settings } = await supabase
      .from("worldpay_settings")
      .select("webhook_secret")
      .eq("id", "00000000-0000-0000-0000-000000000099")
      .maybeSingle();

    const webhookSecret =
      Deno.env.get("WORLDPAY_WEBHOOK_SECRET") ||
      settings?.webhook_secret ||
      "";

    const signatureHeader =
      req.headers.get("x-wp-hmac-signature") ||
      req.headers.get("x-worldpay-signature") ||
      "";

    if (webhookSecret) {
      const valid = await verifyWorldpaySignature(rawBody, signatureHeader, webhookSecret);
      if (!valid) {
        console.warn("[worldpay-webhook] Invalid HMAC signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Worldpay event shape: eventDetails.type + orderDetails.orderCode (= transactionReference)
    const eventType: string =
      (body?.eventDetails as Record<string, string>)?.type ??
      (body?.type as string) ??
      "";

    const transactionRef: string =
      (body?.orderDetails as Record<string, string>)?.orderCode ??
      (body?.transactionReference as string) ??
      (body?.orderCode as string) ??
      "";

    const paymentId: string =
      (body?.paymentId as string) ??
      (body?.orderDetails as Record<string, string>)?.paymentId ??
      transactionRef;

    // Update last_webhook_at
    await supabase
      .from("worldpay_settings")
      .update({ last_webhook_at: new Date().toISOString() })
      .eq("id", "00000000-0000-0000-0000-000000000099");

    if (!transactionRef) {
      return new Response(
        JSON.stringify({ received: true, skipped: "no transactionReference" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const upperEvent = eventType.toUpperCase();

    // ── Authorized / Settled ──────────────────────────────────────────────────
    if (
      ["AUTHORISED", "AUTHORIZED", "SENT_FOR_SETTLEMENT", "SETTLED"].includes(upperEvent)
    ) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, payment_status")
        .eq("payment_reference", transactionRef)
        .maybeSingle();

      if (order && order.payment_status !== "paid") {
        await supabase
          .from("orders")
          .update({ payment_status: "paid", order_status: "processing" })
          .eq("id", order.id);

        await supabase
          .from("payment_transactions")
          .update({ status: "paid" })
          .eq("order_id", order.id);
      }

      // Trigger order confirmed notifications (email + SMS + WhatsApp) async
      const { data: confirmedOrder } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_email, customer_phone, total")
        .eq("payment_reference", transactionRef)
        .maybeSingle();

      if (confirmedOrder) {
        const vars = {
          customer_name: confirmedOrder.customer_name ?? "Customer",
          order_number: confirmedOrder.order_number ?? transactionRef,
          order_total: Number(confirmedOrder.total).toFixed(2),
        };
        const notifyBase = { template_name: "Order Confirmed", message_type: "transactional", variables: vars, order_id: confirmedOrder.id, is_admin_alert: false };

        EdgeRuntime.waitUntil(Promise.all([
          // Customer notifications
          confirmedOrder.customer_email ? supabase.functions.invoke("send-notification", { body: { ...notifyBase, channel: "email", to_email: confirmedOrder.customer_email } }).catch(() => {}) : Promise.resolve(),
          confirmedOrder.customer_phone ? supabase.functions.invoke("send-notification", { body: { ...notifyBase, channel: "sms", to_phone: confirmedOrder.customer_phone } }).catch(() => {}) : Promise.resolve(),
          confirmedOrder.customer_phone ? supabase.functions.invoke("send-notification", { body: { ...notifyBase, channel: "whatsapp", to_phone: confirmedOrder.customer_phone } }).catch(() => {}) : Promise.resolve(),
          // Admin notifications — only fires when payment_status = 'paid', dedup handled inside
          supabase.functions.invoke("admin-notify", { body: { order_id: confirmedOrder.id } }).catch(() => {}),
        ]));
      }
    }

    // ── Refused / Failed ──────────────────────────────────────────────────────
    else if (
      ["REFUSED", "ERROR", "CANCELLED", "EXPIRED", "FAILED"].includes(upperEvent)
    ) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_reference", transactionRef)
        .maybeSingle();

      if (order) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed", order_status: "cancelled" })
          .eq("id", order.id);

        await supabase
          .from("payment_transactions")
          .update({ status: "failed" })
          .eq("order_id", order.id);
      }
    }

    // ── Refunded ──────────────────────────────────────────────────────────────
    else if (["REFUNDED", "REFUND_INITIATED", "REFUND_COMPLETE"].includes(upperEvent)) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_reference", transactionRef)
        .maybeSingle();

      if (order) {
        const refundAmount =
          (body?.refundAmount as number) ??
          ((body?.amount as Record<string, number>)?.value ?? 0);

        // Record the refund if we don't have it yet
        const refundId = (body?.refundId as string) ?? `WH-REF-${Date.now()}`;
        await supabase.from("payment_refunds").upsert({
          order_id: order.id,
          transaction_id: paymentId,
          refund_id: refundId,
          amount: refundAmount,
          status: "completed",
          reason: "Worldpay webhook refund event",
        }, { onConflict: "refund_id" }).maybeSingle();

        // Recalculate payment status
        const { data: refunds } = await supabase
          .from("payment_refunds")
          .select("amount")
          .eq("order_id", order.id)
          .eq("status", "completed");

        const { data: txn } = await supabase
          .from("payment_transactions")
          .select("amount")
          .eq("order_id", order.id)
          .maybeSingle();

        const totalRefunded = (refunds ?? []).reduce(
          (sum: number, r: { amount: number }) => sum + r.amount,
          0,
        );
        const originalAmount = txn?.amount ?? 0;
        const newStatus = totalRefunded >= originalAmount ? "refunded" : "partially_refunded";

        await supabase
          .from("payment_transactions")
          .update({ status: newStatus })
          .eq("order_id", order.id);

        await supabase
          .from("orders")
          .update({ payment_status: newStatus })
          .eq("id", order.id);
      }
    }

    // ── Chargeback ────────────────────────────────────────────────────────────
    else if (["CHARGEBACK", "CHARGEBACK_REVERSAL"].includes(upperEvent)) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_reference", transactionRef)
        .maybeSingle();

      if (order) {
        await supabase
          .from("orders")
          .update({ payment_status: "chargeback", order_status: "on_hold" })
          .eq("id", order.id);
      }
    }

    return new Response(
      JSON.stringify({ received: true, event: eventType, transactionRef }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[worldpay-webhook] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Worldpay Access API ──────────────────────────────────────────────────────

const WP_BASE = "https://access.worldpay.com";
const WP_CONTENT_TYPE = "application/vnd.worldpay.payments.hal+json";

interface WpCredentials {
  serviceKey: string;
  entityId: string;
}

async function getCredentials(
  supabase: ReturnType<typeof createClient>,
): Promise<WpCredentials> {
  // Prefer env vars; fall back to DB settings
  const serviceKey =
    Deno.env.get("WORLDPAY_SERVICE_KEY") ||
    Deno.env.get("WORLDPAY_PASSWORD") ||
    "";
  const entityId =
    Deno.env.get("WORLDPAY_ENTITY") ||
    Deno.env.get("WORLDPAY_MERCHANT_CODE") ||
    "";

  if (serviceKey && entityId) return { serviceKey, entityId };

  // Fall back to DB
  const { data } = await supabase
    .from("worldpay_settings")
    .select("service_key, entity_id")
    .eq("id", "00000000-0000-0000-0000-000000000099")
    .maybeSingle();

  return {
    serviceKey: serviceKey || data?.service_key || "",
    entityId: entityId || data?.entity_id || "",
  };
}

function wpAuthHeader(serviceKey: string): string {
  return `Basic ${btoa(`${serviceKey}:`)}`;
}

// ─── Authorize payment ────────────────────────────────────────────────────────

async function authorizePayment(
  credentials: WpCredentials,
  opts: {
    transactionRef: string;
    sessionHref: string;
    amountPence: number;
    cardholderName: string;
    billingAddress: {
      address1: string;
      city: string;
      postalCode: string;
      countryCode: string;
    };
  },
) {
  const body = {
    transactionReference: opts.transactionRef,
    merchant: { entity: credentials.entityId },
    instruction: {
      narrative: { line1: "PocketGrocery" },
      value: { currency: "GBP", amount: opts.amountPence },
      paymentInstrument: {
        type: "checkout/session",
        href: opts.sessionHref,
      },
      requestAutoSettlement: { enabled: true },
    },
    customer: {
      billingAddress: opts.billingAddress,
    },
    cardholderName: opts.cardholderName,
  };

  const res = await fetch(`${WP_BASE}/api/payments/authorizations`, {
    method: "POST",
    headers: {
      "Content-Type": WP_CONTENT_TYPE,
      "Accept": WP_CONTENT_TYPE,
      "Authorization": wpAuthHeader(credentials.serviceKey),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Worldpay non-JSON response ${res.status}: ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    const msg = (data?.message as string) ||
      (data?.errorName as string) ||
      `Worldpay API error ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// ─── Get authorization status ─────────────────────────────────────────────────

async function getAuthorization(credentials: WpCredentials, paymentHref: string) {
  const res = await fetch(paymentHref, {
    headers: {
      "Accept": WP_CONTENT_TYPE,
      "Authorization": wpAuthHeader(credentials.serviceKey),
    },
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Worldpay get auth non-JSON ${res.status}: ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error((data?.message as string) || `Worldpay get auth error ${res.status}`);
  }

  return data;
}

// ─── Refund ───────────────────────────────────────────────────────────────────

async function issueRefund(
  credentials: WpCredentials,
  paymentId: string,
  amountPence: number,
) {
  const res = await fetch(
    `${WP_BASE}/api/payments/authorizations/${paymentId}/refunds`,
    {
      method: "POST",
      headers: {
        "Content-Type": WP_CONTENT_TYPE,
        "Accept": WP_CONTENT_TYPE,
        "Authorization": wpAuthHeader(credentials.serviceKey),
      },
      body: JSON.stringify({
        value: { currency: "GBP", amount: amountPence },
      }),
    },
  );

  const text = await res.text();
  if (!res.ok) {
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch { /* ignore */ }
    throw new Error((data?.message as string) || `Worldpay refund error ${res.status}`);
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ─── Order creation ───────────────────────────────────────────────────────────

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
}

interface OrderData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name?: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postcode: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  user_id?: string;
}

async function createOrder(
  supabase: ReturnType<typeof createClient>,
  orderData: OrderData,
  paymentRef: string,
  paymentStatus: "authorized" | "paid" | "pending",
): Promise<{ id: string; order_number: string }> {
  const { data: orderNumber } = await supabase.rpc("generate_order_number");

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone,
      company_name: orderData.company_name ?? null,
      delivery_address: orderData.delivery_address,
      delivery_city: orderData.delivery_city,
      delivery_postcode: orderData.delivery_postcode,
      notes: orderData.notes ?? null,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.delivery_fee,
      total: orderData.total,
      payment_method: "card",
      payment_reference: paymentRef,
      payment_status: paymentStatus,
      order_status: paymentStatus === "pending" ? "pending" : "processing",
      user_id: orderData.user_id ?? null,
    })
    .select("id, order_number")
    .single();

  if (orderErr || !order) {
    throw new Error("Failed to create order: " + orderErr?.message);
  }

  // Fetch pricing snapshots from DB for each product
  const productIds = orderData.items.map((i) => i.product_id).filter(Boolean);
  const { data: productPrices } = await supabase
    .from("products")
    .select("id, cost_price, selling_price, profit_amount")
    .in("id", productIds);

  const priceMap = new Map<string, { cost_price: number | null; selling_price: number | null; profit_amount: number | null }>();
  for (const p of (productPrices ?? [])) {
    priceMap.set(p.id, {
      cost_price: p.cost_price ?? null,
      selling_price: p.selling_price ?? null,
      profit_amount: p.profit_amount ?? null,
    });
  }

  const items = orderData.items.map((item) => {
    const snapshot = priceMap.get(item.product_id);
    const costAtOrder = snapshot?.cost_price ?? null;
    const sellAtOrder = snapshot?.selling_price ?? item.unit_price;
    const profitAtOrder = costAtOrder != null && sellAtOrder != null
      ? Math.round((sellAtOrder - costAtOrder) * 100) / 100
      : null;

    return {
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      // Pricing snapshot at time of order
      cost_price_at_order: costAtOrder,
      selling_price_at_order: sellAtOrder,
      profit_at_order: profitAtOrder,
    };
  });

  const { error: itemsErr } = await supabase.from("order_items").insert(items);
  if (itemsErr) throw new Error("Failed to create order items: " + itemsErr.message);

  return order;
}

// ─── Reduce stock ─────────────────────────────────────────────────────────────

async function reduceStock(
  supabase: ReturnType<typeof createClient>,
  items: OrderItem[],
) {
  for (const item of items) {
    await supabase.rpc("reduce_product_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    }).catch(() => {
      // Non-fatal: log but don't fail order creation
      console.warn("Stock reduction failed for", item.product_id);
    });
  }
}

// ─── Parse card details from Worldpay response ────────────────────────────────

function parseCardDetails(wpData: Record<string, unknown>) {
  const instrument = wpData?.paymentInstrument as Record<string, unknown> | undefined;
  const cardNumber = (instrument?.cardNumber as string) ?? "";
  const lastFour = cardNumber.length >= 4 ? cardNumber.slice(-4) : null;
  const scheme = (instrument?.paymentBrand as string) ?? null;
  const authCode = (wpData?.authorizationCode as string) ?? null;
  const paymentId = (wpData?.paymentId as string) ?? null;

  return { lastFour, scheme, authCode, paymentId };
}

// ─── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const body = await req.json() as Record<string, unknown>;
    const action = (body.action as string) || "authorize";

    // ── TEST CONNECTION ───────────────────────────────────────────────────────
    if (action === "test_connection") {
      const credentials = await getCredentials(supabase);
      const configured = !!(credentials.serviceKey && credentials.entityId);
      return new Response(
        JSON.stringify({ configured, entityId: configured ? credentials.entityId : null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── REFUND ────────────────────────────────────────────────────────────────
    if (action === "refund") {
      const { orderId, transactionId, amountPence, reason } = body as {
        orderId: string;
        transactionId: string;
        amountPence: number;
        reason?: string;
      };

      if (!orderId || !transactionId || !amountPence) {
        return new Response(
          JSON.stringify({ error: "orderId, transactionId and amountPence are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const credentials = await getCredentials(supabase);
      if (!credentials.serviceKey) {
        return new Response(
          JSON.stringify({ error: "Worldpay service key not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const refundData = await issueRefund(credentials, transactionId, amountPence);

      const refundId = (refundData?.refundId as string) ||
        (refundData?.id as string) ||
        `REF-${Date.now()}`;

      // Record the refund
      await supabase.from("payment_refunds").insert({
        order_id: orderId,
        transaction_id: transactionId,
        refund_id: refundId,
        amount: amountPence,
        status: "completed",
        reason: reason ?? null,
      });

      // Get total refunded to determine payment status
      const { data: refunds } = await supabase
        .from("payment_refunds")
        .select("amount")
        .eq("order_id", orderId)
        .eq("status", "completed");

      const { data: txn } = await supabase
        .from("payment_transactions")
        .select("amount")
        .eq("order_id", orderId)
        .maybeSingle();

      const totalRefunded = (refunds ?? []).reduce(
        (sum: number, r: { amount: number }) => sum + r.amount,
        0,
      );

      const originalAmount = txn?.amount ?? 0;
      const paymentStatus = totalRefunded >= originalAmount ? "refunded" : "partially_refunded";

      await supabase
        .from("payment_transactions")
        .update({ status: paymentStatus })
        .eq("order_id", orderId);

      await supabase
        .from("orders")
        .update({ payment_status: paymentStatus })
        .eq("id", orderId);

      // Update worldpay_settings last_transaction_at
      await supabase
        .from("worldpay_settings")
        .update({ last_transaction_at: new Date().toISOString() })
        .eq("id", "00000000-0000-0000-0000-000000000099");

      return new Response(
        JSON.stringify({ success: true, refundId, status: paymentStatus }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── VERIFY 3DS ────────────────────────────────────────────────────────────
    if (action === "verify_3ds") {
      const { paymentHref, orderData, pendingOrderId } = body as {
        paymentHref: string;
        orderData: OrderData;
        pendingOrderId?: string;
      };

      if (!paymentHref) {
        return new Response(
          JSON.stringify({ error: "paymentHref is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const credentials = await getCredentials(supabase);
      const wpData = await getAuthorization(credentials, paymentHref);

      const outcome = ((wpData.outcome as string) || "").toLowerCase();
      const { lastFour, scheme, authCode, paymentId } = parseCardDetails(wpData);

      if (outcome !== "authorized" && outcome !== "sentforsettlement") {
        return new Response(
          JSON.stringify({ success: false, error: "Payment not authorized after 3DS" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Create or update order
      let orderId = pendingOrderId ?? "";
      let orderNumber = "";

      if (!orderId && orderData) {
        const order = await createOrder(
          supabase,
          orderData,
          paymentId ?? "verified",
          "paid",
        );
        orderId = order.id;
        orderNumber = order.order_number;
        await reduceStock(supabase, orderData.items);
      } else if (orderId) {
        const { data: o } = await supabase
          .from("orders")
          .update({ payment_status: "paid", order_status: "processing", payment_reference: paymentId ?? undefined })
          .eq("id", orderId)
          .select("order_number")
          .maybeSingle();
        orderNumber = o?.order_number ?? "";
      }

      // Record transaction
      await supabase.from("payment_transactions").upsert({
        order_id: orderId,
        transaction_id: paymentId ?? "unknown",
        payment_method: "card",
        amount: Math.round((orderData?.total ?? 0) * 100),
        currency: "GBP",
        status: "paid",
        authorization_code: authCode,
        card_last_four: lastFour,
        card_scheme: scheme,
        worldpay_response: wpData as unknown as Record<string, unknown>,
      }, { onConflict: "order_id" });

      await supabase
        .from("worldpay_settings")
        .update({ last_transaction_at: new Date().toISOString() })
        .eq("id", "00000000-0000-0000-0000-000000000099");

      return new Response(
        JSON.stringify({ success: true, orderNumber }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── AUTHORIZE (default) ───────────────────────────────────────────────────
    const {
      sessionHref,
      cardholderName,
      orderData,
    } = body as {
      sessionHref: string;
      cardholderName: string;
      orderData: OrderData;
    };

    if (!sessionHref || !orderData) {
      return new Response(
        JSON.stringify({ error: "sessionHref and orderData are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const credentials = await getCredentials(supabase);
    if (!credentials.serviceKey || !credentials.entityId) {
      return new Response(
        JSON.stringify({ error: "Worldpay credentials not configured. Please configure in admin Settings → Payments → Worldpay." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate transaction reference before creating order
    const transactionRef = `PG-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const amountPence = Math.round(orderData.total * 100);

    let wpData: Record<string, unknown>;
    try {
      wpData = await authorizePayment(credentials, {
        transactionRef,
        sessionHref,
        amountPence,
        cardholderName: cardholderName || orderData.customer_name,
        billingAddress: {
          address1: orderData.delivery_address,
          city: orderData.delivery_city,
          postalCode: orderData.delivery_postcode,
          countryCode: "GB",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: String(err) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const outcome = ((wpData.outcome as string) || "").toLowerCase();
    const { lastFour, scheme, authCode, paymentId } = parseCardDetails(wpData);

    // ── 3DS required ──────────────────────────────────────────────────────────
    if (outcome === "3ds" || outcome === "challenged") {
      const links = wpData._links as Record<string, Record<string, string>> | undefined;
      const challengeUrl =
        links?.["3ds:payment"]?.href ||
        links?.["3ds:challengeLink"]?.href ||
        "";

      // The payment href to poll after challenge
      const paymentHref =
        links?.["payments:authorize"]?.href ||
        links?.["self"]?.href ||
        `${WP_BASE}/api/payments/authorizations/${paymentId}`;

      return new Response(
        JSON.stringify({
          success: false,
          requires3ds: true,
          challengeUrl,
          paymentHref,
          orderData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Authorized ────────────────────────────────────────────────────────────
    if (outcome === "authorized" || outcome === "sentforsettlement") {
      const order = await createOrder(
        supabase,
        orderData,
        paymentId ?? transactionRef,
        "paid",
      );

      await supabase.from("payment_transactions").insert({
        order_id: order.id,
        transaction_id: paymentId ?? transactionRef,
        payment_method: "card",
        amount: amountPence,
        currency: "GBP",
        status: "paid",
        authorization_code: authCode,
        card_last_four: lastFour,
        card_scheme: scheme,
        worldpay_response: wpData as unknown as Record<string, unknown>,
      });

      EdgeRuntime.waitUntil(reduceStock(supabase, orderData.items));

      await supabase
        .from("worldpay_settings")
        .update({ last_transaction_at: new Date().toISOString() })
        .eq("id", "00000000-0000-0000-0000-000000000099");

      return new Response(
        JSON.stringify({ success: true, orderNumber: order.order_number }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Declined / refused ────────────────────────────────────────────────────
    const declineReason =
      (wpData?.refusalCode as string) ||
      (wpData?.refusalDescription as string) ||
      outcome ||
      "Payment declined";

    return new Response(
      JSON.stringify({ success: false, error: `Payment declined: ${declineReason}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[worldpay-payment] error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

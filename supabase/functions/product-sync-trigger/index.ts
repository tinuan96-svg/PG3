import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, x-sync-secret",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  event?: string;
  product?: CentralHubProduct;
  products?: CentralHubProduct[];
  product_id?: string;
}

interface CentralHubProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  product_type?: string | null;
  brand?: string | null;
  warehouse_location?: string | null;
  weight?: number | null;
  gtin?: string | null;
  unit?: string | null;
  slug?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// CentralHub price = cost_price (what we pay). Selling price = cost × (1 + markup).
const DEFAULT_MARKUP_PCT = 3;

// ─── Brand extraction ─────────────────────────────────────────────────────────

function extractBrand(p: CentralHubProduct): string {
  return p.brand ?? "";
}

// ─── CentralHub-owned update fields ──────────────────────────────────────────
// These are the ONLY fields written to existing products. Admin-enriched fields
// (image, description, seo_*, slug, selling_price, approval_status, etc.) are
// intentionally excluded so they are never overwritten by the sync.

function centralhubUpdateFields(p: CentralHubProduct, now: string) {
  const costPrice = Number(p.price ?? 0);

  console.log("Product brand:", p.brand ?? null);

  return {
    name:                  p.name || "Unnamed Product",
    cost_price:            costPrice,
    compare_price:         0,
    stock_qty:             Number(p.stock ?? 0),
    centralhub_status:     Number(p.stock ?? 0) > 0 ? "active" : "inactive",
    sku:                   "",
    weight_grams:          p.weight != null ? Number(p.weight) : null,
    barcode:               p.gtin || "",
    brand:                 extractBrand(p),
    unit:                  p.unit || "",
    warehouse_location:    p.warehouse_location || "",
    product_type:          p.product_type || "simple",
    centralhub_product_id: p.id,
    source_product_id:     p.id,
    source_type:           "centralhub",
    synced_at:             now,
    updated_at:            now,
  };
}

// ─── Slug generator ────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ─── Category resolution ───────────────────────────────────────────────────────

// ─── Upsert one product ────────────────────────────────────────────────────────

async function upsertProduct(
  supabase: ReturnType<typeof createClient>,
  p: CentralHubProduct,
  slugSet: Set<string>,
): Promise<"inserted" | "updated" | "failed"> {
  try {
    const now = new Date().toISOString();
    const updateFields = centralhubUpdateFields(p, now);

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("source_product_id", p.id)
      .maybeSingle();

    if (existing) {
      // UPDATE: only CentralHub-owned fields, admin fields preserved
      await supabase.from("products").update(updateFields).eq("id", existing.id);
      return "updated";
    }

    // INSERT: new product from CentralHub
    // CentralHub has no image columns — admin uploads images after sync
    const primaryImage = "";
    const gallery: string[] = [];

    // Prefer CentralHub slug, fall back to generated
    let slug = p.slug ? p.slug.trim() : "";
    if (!slug) slug = generateSlug(p.name ?? "product");
    if (slugSet.has(slug)) slug = `${slug}-${p.id.slice(0, 8)}`;
    slugSet.add(slug);

    const costPrice = updateFields.cost_price;
    // Selling price = cost × 1.03 (3% markup). Admin can change this later.
    const sellingPrice = costPrice > 0
      ? Math.round(costPrice * (1 + DEFAULT_MARKUP_PCT / 100) * 100) / 100
      : 0;
    const profitAmount = Math.round((sellingPrice - costPrice) * 100) / 100;

    await supabase.from("products").insert({
      ...updateFields,
      slug,
      price:              sellingPrice,
      selling_price:      sellingPrice,
      markup_percentage:  DEFAULT_MARKUP_PCT,
      profit_amount:      profitAmount,
      image:              primaryImage,
      gallery:            gallery.length > 0 ? gallery : [],
      category_id:        null,
      short_description:  "",
      description:        "",
      seo_title:          "",
      seo_description:    "",
      seo_keywords:       "",
      tags:               [],
      featured:           false,
      approval_status:    "draft",
      visibility_status:  "hidden",
      needs_admin_review: true,
      created_at:         now,
    });

    return "inserted";
  } catch (err) {
    console.error("[product-sync-trigger] upsertProduct error:", p.id, err);
    return "failed";
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Validate sync secret
    const syncSecret = Deno.env.get("CENTRALHUB_SYNC_SECRET") || Deno.env.get("SYNC_SECRET") || "";
    const incomingSecret = req.headers.get("x-sync-secret") ?? "";

    if (syncSecret && incomingSecret !== syncSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid x-sync-secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse payload
    const payload: WebhookPayload = await req.json().catch(() => ({}));
    const eventType = payload.event ?? "product.updated";

    const products: CentralHubProduct[] = [];
    if (payload.product) products.push(payload.product);
    if (payload.products) products.push(...payload.products);

    if (products.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "No products to process", inserted: 0, updated: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Service-role client bypasses RLS for sync operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Log webhook event
    const firstProductId = products[0]?.id ?? null;
    await supabase.from("sync_webhook_events").insert({
      event_type: eventType,
      centralhub_product_id: firstProductId,
      payload: payload as unknown as Record<string, unknown>,
      processed: false,
      received_at: new Date().toISOString(),
    });

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from("centralhub_sync_logs")
      .insert({
        triggered_by: "webhook",
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();
    const logId = syncLog?.id ?? null;

    // Load existing slugs to avoid duplicates
    const { data: slugRows } = await supabase.from("products").select("slug");
    const slugSet = new Set<string>((slugRows ?? []).map((r: { slug: string }) => r.slug));

    // Process all products
    let inserted = 0, updated = 0, failed = 0;
    const errors: string[] = [];

    const results = await Promise.allSettled(
      products.map((p) => upsertProduct(supabase, p, slugSet)),
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        if (r.value === "inserted") inserted++;
        else if (r.value === "updated") updated++;
        else failed++;
      } else {
        failed++;
        if (errors.length < 20) errors.push(String(r.reason));
      }
    }

    const completedAt = new Date().toISOString();
    const status = failed === 0 ? "success" : inserted + updated > 0 ? "partial" : "failed";

    // Update sync log
    if (logId) {
      await supabase
        .from("centralhub_sync_logs")
        .update({
          status,
          products_fetched:  products.length,
          products_inserted: inserted,
          products_updated:  updated,
          products_synced:   inserted + updated,
          products_failed:   failed,
          error_messages:    errors.length > 0 ? errors : null,
          completed_at:      completedAt,
        })
        .eq("id", logId);
    }

    // Mark webhook event as processed
    await supabase
      .from("sync_webhook_events")
      .update({
        processed:     failed === 0,
        error_message: errors.length > 0 ? errors[0] : null,
        processed_at:  completedAt,
      })
      .eq("centralhub_product_id", firstProductId)
      .eq("processed", false);

    return new Response(
      JSON.stringify({ ok: true, eventType, inserted, updated, failed, logId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[product-sync-trigger] fatal error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

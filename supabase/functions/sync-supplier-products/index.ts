import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Normalize helpers ────────────────────────────────────────────────────────

const FILLER_PHRASES = ["best quality", "high quality", "top quality", "extra special"];
const FILLER_WORDS = [
  "premium", "authentic", "original", "pure", "natural", "fresh", "special",
  "excellent", "superior", "genuine", "traditional", "classic", "delicious",
  "tasty", "organic", "new", "best",
];

function cleanProductTitle(raw: string): string {
  let t = raw.trim();
  for (const p of FILLER_PHRASES) t = t.replace(new RegExp(`\\b${p}\\b`, "gi"), "");
  for (const w of FILLER_WORDS) t = t.replace(new RegExp(`\\b${w}\\b`, "gi"), "");
  return t.replace(/\s+/g, " ").trim();
}

interface WeightResult { normalized: string; value: number; unit: string }

function normalizeWeight(raw: string | null): WeightResult | null {
  if (!raw?.trim()) return null;
  const c = raw.trim().replace(/\s+/g, "");
  const m = c.match(/^(\d+(?:\.\d+)?)(kg|kgs|g|gm|gms|mg|ml|l|ltr|litres?|liters?|pcs?|pieces?|pack|packets?|nos?|units?)$/i);
  if (!m) return null;
  let v = parseFloat(m[1]);
  const ru = m[2].toLowerCase();
  let unit: string;
  if (ru === "kg" || ru === "kgs") { unit = v < 1 ? (v = Math.round(v * 1000), "g") : "kg"; }
  else if (["g", "gm", "gms"].includes(ru)) { if (v >= 1000 && v % 1000 === 0) { v /= 1000; unit = "kg"; } else unit = "g"; }
  else if (ru === "mg") unit = "mg";
  else if (ru === "ml") { if (v >= 1000 && v % 1000 === 0) { v /= 1000; unit = "l"; } else unit = "ml"; }
  else if (["l", "ltr", "litre", "litres", "liter", "liters"].includes(ru)) unit = "l";
  else if (ru.startsWith("pc") || ru.startsWith("piece")) unit = "pcs";
  else if (ru.startsWith("pack") || ru.startsWith("packet")) unit = "pack";
  else if (ru === "no" || ru === "nos") unit = "pcs";
  else if (ru === "unit" || ru === "units") unit = "pcs";
  else unit = ru;
  return { normalized: `${v}${unit}`, value: v, unit };
}

function extractWeightFromTitle(title: string): { weight: WeightResult | null; titleWithoutWeight: string } {
  const pat = /\b(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|gms|mg|ml|l|ltr|litres?|liters?|pcs?|pieces?|pack|packets?)\b/gi;
  const m = pat.exec(title);
  if (!m) return { weight: null, titleWithoutWeight: title };
  const weight = normalizeWeight(m[0].replace(/\s+/g, ""));
  const titleWithoutWeight = title.replace(m[0], "").replace(/\s+/g, " ").trim().replace(/[-–—]+$/, "").trim();
  return { weight, titleWithoutWeight };
}

function normalizeVariationLabel(attrs: Array<{ name: string; option: string }>): string {
  return attrs.map((a) => { const w = normalizeWeight(a.option.trim()); return w ? w.normalized : a.option.trim(); }).join(", ");
}

function buildVariationTitle(base: string, label: string): string {
  return `${base} \u2013 ${label}`;
}

function normalizeProductTitle(rawTitle: string): { cleanTitle: string; weightNormalized: WeightResult | null; wasCleaned: boolean } {
  const afterFiller = cleanProductTitle(rawTitle);
  const { weight, titleWithoutWeight } = extractWeightFromTitle(afterFiller);
  let finalTitle = afterFiller;
  let weightNormalized: WeightResult | null = null;
  if (weight) { weightNormalized = weight; finalTitle = `${titleWithoutWeight} ${weight.normalized}`.trim(); }
  return { cleanTitle: finalTitle, weightNormalized, wasCleaned: finalTitle.trim() !== rawTitle.trim() };
}

// ─── Classify helpers ─────────────────────────────────────────────────────────

const KNOWN_BRANDS = [
  "Nirapara", "Eastern", "Double Horse", "Brahmins", "Haldiram", "Melam",
  "Kitchen Treasures", "Everest", "MDH", "Shan", "Grand Sweets", "Priya",
  "MTR", "Aachi", "Catch", "Pushpa", "Swad", "TRS", "Deep", "Laxmi",
  "Kohinoor", "Daawat", "India Gate", "Tata", "Lijjat", "Patanjali",
  "Knorr", "Naagin", "Ashoka", "Maya Kaimal", "Patak", "Spice Garden",
  "Vandevi", "Ahmed", "National", "Laziza", "Sunrise", "Goldiee",
  "Durra", "Al Kabeer", "Bombay Kitchen", "Gits",
];

const CATEGORY_KEYWORDS = [
  { keywords: ["rice", "matta", "basmati", "sona masoori", "ponni", "biryani rice", "raw rice", "parboiled"], category: "Rice & Grains", tags: ["rice", "grains"] },
  { keywords: ["puttu", "podi", "flour", "atta", "maida", "semolina", "rava", "appam", "idiyappam", "pathiri"], category: "Rice & Flour", tags: ["flour", "breakfast"] },
  { keywords: ["masala", "spice", "chilli", "chili", "turmeric", "coriander", "cumin", "pepper", "cardamom", "cloves", "cinnamon", "nutmeg", "fenugreek", "mustard seed", "curry powder", "garam masala", "sambar", "rasam", "fish curry", "biryani masala", "chaat masala"], category: "Spices & Masalas", tags: ["spices", "masala"] },
  { keywords: ["chips", "snack", "mixture", "murukku", "chakli", "namkeen", "popcorn", "peanut", "cashew", "halwa", "ladoo", "barfi", "sweet", "biscuit", "cookie", "wafer", "banana chips"], category: "Snacks & Sweets", tags: ["snacks"] },
  { keywords: ["pickle", "achar", "mango pickle", "lime pickle", "chutney", "achaar", "mixed pickle"], category: "Pickles & Chutneys", tags: ["pickles", "condiments"] },
  { keywords: ["oil", "ghee", "butter", "coconut oil", "sesame oil", "mustard oil", "sunflower", "groundnut oil"], category: "Oils & Ghee", tags: ["oils"] },
  { keywords: ["dal", "lentil", "pulse", "moong", "chana", "toor", "urad", "masoor", "rajma", "kidney bean", "black eye bean", "chickpea", "green pea"], category: "Pulses & Lentils", tags: ["pulses", "lentils"] },
  { keywords: ["ready meal", "instant", "ready to eat", "ready to cook", "curry paste", "curry sauce", "canned", "tinned", "ready"], category: "Ready Meals", tags: ["ready meals", "convenience"] },
  { keywords: ["tea", "coffee", "chai", "masala tea", "green tea", "black tea", "herbal tea"], category: "Tea & Coffee", tags: ["beverages", "tea"] },
  { keywords: ["coconut", "coconut milk", "coconut cream", "desiccated coconut", "coconut powder"], category: "Coconut Products", tags: ["coconut"] },
  { keywords: ["idli", "dosa", "breakfast", "porridge", "oats", "cornflakes", "muesli", "upma"], category: "Breakfast Items", tags: ["breakfast"] },
  { keywords: ["frozen", "freeze", "ice cream", "frozen meal", "frozen veg"], category: "Frozen Foods", tags: ["frozen"] },
  { keywords: ["sauce", "ketchup", "vinegar", "soy sauce", "tamarind", "paste", "spread"], category: "Condiments & Sauces", tags: ["condiments"] },
  { keywords: ["papad", "pappadam", "pappads", "appalam"], category: "Papads & Wafers", tags: ["papads"] },
];

function classifyCategory(title: string): { category: string; tags: string[] } {
  const lower = title.toLowerCase();
  for (const { keywords, category, tags } of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return { category, tags };
  }
  return { category: "General Grocery", tags: ["grocery"] };
}

function detectAndCleanBrand(title: string, extraBrands: string[]): { brand: string | null; cleanTitle: string } {
  const all = [...new Set([...KNOWN_BRANDS, ...extraBrands])].sort((a, b) => b.length - a.length);
  for (const brand of all) {
    const lower = title.toLowerCase();
    const bl = brand.toLowerCase();
    const dup = new RegExp(`^${bl}\\s+${bl}\\s+`, "i");
    if (dup.test(title)) return { brand, cleanTitle: title.replace(dup, "").trim() };
    if (lower.startsWith(bl + " ")) return { brand, cleanTitle: title.slice(brand.length).trim() };
  }
  return { brand: null, cleanTitle: title };
}

function generateSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function mapStockStatus(s: string): "in_stock" | "out_of_stock" | "backorder" {
  const m: Record<string, "in_stock" | "out_of_stock" | "backorder"> = { instock: "in_stock", outofstock: "out_of_stock", onbackorder: "backorder" };
  return m[s] ?? "in_stock";
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

function generateProductSEO(cleanTitle: string, brand: string | null, category: string, weight?: string | null) {
  const fullName = brand ? `${brand} ${cleanTitle}` : cleanTitle;
  const ws = weight ? ` ${weight}` : "";
  const cl = category.toLowerCase();
  const phrase =
    cl.includes("rice") ? "premium Indian rice"
    : cl.includes("spice") || cl.includes("masala") ? "authentic South Indian spice"
    : cl.includes("snack") ? "traditional Kerala snack"
    : cl.includes("pickle") ? "authentic Indian pickle"
    : cl.includes("oil") ? "high-quality cooking oil"
    : cl.includes("pulse") || cl.includes("lentil") ? "nutritious Indian pulse"
    : cl.includes("flour") ? "authentic Indian flour"
    : cl.includes("coconut") ? "fresh coconut product"
    : cl.includes("frozen") ? "convenient frozen food"
    : cl.includes("tea") ? "aromatic Indian tea"
    : "authentic Indian grocery product";
  const seoTitle = `Buy ${fullName}${ws} Online UK | PocketGrocery`;
  const seoDescription = `Buy ${fullName}${ws} online and get it delivered to your door across the UK. Authentic ${phrase} from PocketGrocery — the UK's leading Kerala grocery store. Fast delivery, quality guaranteed.`;
  const description = `${fullName}${ws} is an ${phrase} available for home delivery across the UK. ${brand ? `${brand} is a trusted brand known for quality and authentic flavours. ` : ""}Perfect for preparing traditional South Indian and Kerala meals at home. Order online at PocketGrocery for fast, reliable UK delivery.`;
  return { seoTitle, seoDescription, description };
}

// ─── WooCommerce API ──────────────────────────────────────────────────────────

interface WCProduct {
  id: number; name: string; type: string; description: string; price: string;
  regular_price: string; stock_quantity: number | null; stock_status: string;
  weight: string; images: Array<{ src: string }>; variations: number[];
  attributes: Array<{ name: string; options: string[] }>;
}

interface WCVariation {
  id: number; price: string; regular_price: string; stock_quantity: number | null;
  stock_status: string; attributes: Array<{ name: string; option: string }>;
  images: Array<{ src: string }>;
}

async function fetchWCPage(apiUrl: string, ck: string, cs: string, page: number): Promise<WCProduct[]> {
  const auth = btoa(`${ck}:${cs}`);
  const url = `${apiUrl.replace(/\/$/, "")}/wp-json/wc/v3/products?page=${page}&per_page=100&status=publish`;
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WC API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`WC API non-array: ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

async function fetchWCVariations(apiUrl: string, ck: string, cs: string, productId: number): Promise<WCVariation[]> {
  const auth = btoa(`${ck}:${cs}`);
  const url = `${apiUrl.replace(/\/$/, "")}/wp-json/wc/v3/products/${productId}/variations?per_page=100`;
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

const CATEGORY_IMAGES: Record<string, string> = {
  "Rice & Grains": "/rice-grains.webp", "Rice & Flour": "/rice-flour.webp",
  "Spices & Masalas": "/spices.webp", "Snacks & Sweets": "/snacks.webp",
  "Pickles & Chutneys": "/pickles.webp", "Oils & Ghee": "/oils.webp",
  "Pulses & Lentils": "/pulses.webp", "Ready Meals": "/ready-meals.webp",
  "Tea & Coffee": "/tea.webp", "Coconut Products": "/coconut.webp",
  "Breakfast Items": "/breakfast.webp", "Frozen Foods": "/frozen.webp",
  "Condiments & Sauces": "/condiments.webp", "Papads & Wafers": "/papads.webp",
  "General Grocery": "/grocery.webp",
};

// ─── Main sync logic ──────────────────────────────────────────────────────────

interface SyncResult {
  success: boolean; logId: string | null; connectionId: string; connectionName: string;
  productsFetched: number; productsInserted: number; productsUpdated: number;
  productsFailed: number; errors: string[]; debugLogs: string[];
}

async function syncConnection(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  connectionId: string,
  triggeredBy: string
): Promise<SyncResult> {
  const debugLogs: string[] = [];
  const errors: string[] = [];
  let fetched = 0, inserted = 0, updated = 0, failed = 0;

  const log = (msg: string) => debugLogs.push(`[${new Date().toISOString()}] ${msg}`);

  const { data: conn, error: connErr } = await supabase
    .from("supplier_connections").select("*").eq("id", connectionId).maybeSingle();

  if (connErr || !conn) {
    return { success: false, logId: null, connectionId, connectionName: "", productsFetched: 0, productsInserted: 0, productsUpdated: 0, productsFailed: 0, errors: [connErr?.message ?? "Connection not found"], debugLogs };
  }

  log(`Starting sync for connection: ${conn.name} (${conn.api_url})`);

  const { data: syncLogRow } = await supabase
    .from("supplier_sync_logs")
    .insert({ connection_id: connectionId, connection_name: conn.name, triggered_by: triggeredBy })
    .select("id").single();
  const logId = syncLogRow?.id ?? null;

  const { data: slugRows } = await supabase.from("products").select("slug");
  const existingSlugs = new Set<string>((slugRows ?? []).map((r: { slug: string }) => r.slug));

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `${conn.api_url.replace(/\/$/, "")}/wp-json/wc/v3/products?page=${page}&per_page=100&status=publish`;
      log(`Fetching page ${page}: ${url}`);

      let pageProducts: WCProduct[];
      try {
        pageProducts = await fetchWCPage(conn.api_url, conn.consumer_key, conn.consumer_secret, page);
      } catch (err) {
        errors.push(`Page ${page} fetch error: ${String(err)}`);
        log(`ERROR fetching page ${page}: ${String(err)}`);
        break;
      }

      log(`Page ${page} returned ${pageProducts.length} products`);
      if (pageProducts.length === 0) { hasMore = false; break; }
      fetched += pageProducts.length;

      for (const wcp of pageProducts) {
        try {
          let variations: WCVariation[] = [];
          if (wcp.type === "variable" && wcp.variations.length > 0) {
            log(`Fetching variations for product ${wcp.id} (${wcp.name})`);
            variations = await fetchWCVariations(conn.api_url, conn.consumer_key, conn.consumer_secret, wcp.id);
            log(`Product ${wcp.id} has ${variations.length} variations`);
          }

          const items: Array<{
            supplierId: string; rawTitle: string; price: number;
            stockQty: number; stockStatus: string; rawWeight: string | null;
            images: string[]; variationAttrs: Array<{ name: string; option: string }>;
          }> = [];

          if (wcp.type === "variable" && variations.length > 0) {
            for (const v of variations) {
              items.push({
                supplierId: `${wcp.id}-${v.id}`,
                rawTitle: wcp.name,
                price: parseFloat(v.price || v.regular_price) || 0,
                stockQty: v.stock_quantity ?? 0,
                stockStatus: v.stock_status,
                rawWeight: null,
                images: v.images.length > 0 ? v.images.map((i) => i.src) : wcp.images.map((i) => i.src),
                variationAttrs: v.attributes,
              });
            }
          } else {
            items.push({
              supplierId: String(wcp.id),
              rawTitle: wcp.name,
              price: parseFloat(wcp.price || wcp.regular_price) || 0,
              stockQty: wcp.stock_quantity ?? 0,
              stockStatus: wcp.stock_status,
              rawWeight: wcp.weight || null,
              images: wcp.images.map((i) => i.src),
              variationAttrs: [],
            });
          }

          for (const item of items) {
            log(`Processing "${item.rawTitle}" (supplier_id: ${item.supplierId})`);

            const { brand, cleanTitle: brandCleaned } = detectAndCleanBrand(item.rawTitle, []);
            console.log("Product brand:", brand ?? null);
            if (brand) log(`  Brand detected: ${brand}`);

            const { cleanTitle, weightNormalized, wasCleaned } = normalizeProductTitle(brandCleaned);
            if (wasCleaned) log(`  Title normalized: "${item.rawTitle}" → "${cleanTitle}"`);
            if (weightNormalized) log(`  Weight normalized: ${weightNormalized.normalized}`);

            let displayTitle: string;
            let weightForDisplay: string | null = null;

            if (item.variationAttrs.length > 0) {
              const varLabel = normalizeVariationLabel(item.variationAttrs);
              displayTitle = buildVariationTitle(cleanTitle, varLabel);
              weightForDisplay = varLabel;
              log(`  Variation title: "${displayTitle}"`);
            } else {
              displayTitle = cleanTitle;
              weightForDisplay = weightNormalized?.normalized ?? item.rawWeight ?? null;
            }

            const weightResult = weightNormalized ?? (item.rawWeight ? normalizeWeight(item.rawWeight) : null);
            const { category, tags } = classifyCategory(displayTitle);
            log(`  Category: ${category}, Tags: ${tags.join(", ")}`);

            const storePrice = item.price > 0 ? Math.ceil(item.price * (1 + conn.markup_percentage / 100) * 100) / 100 : 0;
            log(`  Supplier price: £${item.price} → Store price: £${storePrice} (${conn.markup_percentage}% markup)`);

            const seo = generateProductSEO(displayTitle, brand, category, weightForDisplay);
            const needsAiImage = item.images.length === 0;
            const images = needsAiImage ? [CATEGORY_IMAGES[category] ?? "/grocery.webp"] : item.images;

            let categoryId: string | null = null;
            const { data: existingCat } = await supabase.from("categories").select("id").ilike("name", category).maybeSingle();
            if (existingCat) {
              categoryId = existingCat.id;
            } else {
              const { data: newCat } = await supabase.from("categories").insert({ name: category, slug: generateSlug(category) }).select("id").single();
              categoryId = newCat?.id ?? null;
              if (categoryId) log(`  Created new category: ${category}`);
            }

            const supplierProductId = String(wcp.id);

            const { data: existingBySupplier } = await supabase
              .from("products").select("id").eq("supplier_product_id", supplierProductId).eq("supplier_connection_id", connectionId).maybeSingle();

            if (existingBySupplier) {
              const { error: updErr } = await supabase.from("products").update({
                stock_quantity: item.stockQty,
                stock_status: mapStockStatus(item.stockStatus),
                supplier_price: item.price,
                price: storePrice,
                supplier_id: item.supplierId,
                weight: weightResult?.normalized ?? item.rawWeight,
                weight_value: weightResult?.value ?? null,
                weight_unit: weightResult?.unit ?? null,
                needs_ai_image: needsAiImage,
                updated_at: new Date().toISOString(),
              }).eq("id", existingBySupplier.id);
              if (updErr) throw new Error(`Update by supplier_id failed: ${updErr.message}`);
              log(`  Updated existing product (by supplier_id: ${item.supplierId})`);
              updated++;
              continue;
            }

            const { data: existingByName } = await supabase
              .from("products").select("id").ilike("name", displayTitle).maybeSingle();

            if (existingByName) {
              const { error: updErr } = await supabase.from("products").update({
                stock_quantity: item.stockQty,
                stock_status: mapStockStatus(item.stockStatus),
                supplier_price: item.price,
                price: storePrice,
                supplier_id: item.supplierId,
                supplier_connection_id: connectionId,
                updated_at: new Date().toISOString(),
              }).eq("id", existingByName.id);
              if (updErr) throw new Error(`Update by name failed: ${updErr.message}`);
              log(`  Updated duplicate (by name match: "${displayTitle}")`);
              updated++;
              continue;
            }

            let slug = generateSlug(displayTitle);
            let counter = 1;
            while (existingSlugs.has(slug)) { slug = `${generateSlug(displayTitle)}-${counter}`; counter++; }
            existingSlugs.add(slug);

            const { error: insErr } = await supabase.from("products").insert({
              name: displayTitle,
              slug,
              raw_title: item.rawTitle,
              description: seo.description,
              short_description: seo.description.slice(0, 160),
              seo_title: seo.seoTitle,
              seo_description: seo.seoDescription,
              price: storePrice,
              supplier_price: item.price,
              offer_price: null,
              stock_quantity: item.stockQty,
              stock_status: mapStockStatus(item.stockStatus),
              weight: weightResult?.normalized ?? item.rawWeight,
              weight_value: weightResult?.value ?? null,
              weight_unit: weightResult?.unit ?? null,
              images,
              needs_ai_image: needsAiImage,
              tags,
              category_id: categoryId,
              brand: brand ?? null,
              status: "draft",
              supplier_id: item.supplierId,
              supplier_product_id: supplierProductId,
              supplier_connection_id: connectionId,
              coin_reward: Math.max(1, Math.floor(storePrice * 2)),
              profit_margin: conn.markup_percentage,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            if (insErr) throw new Error(`Insert failed: ${insErr.message}`);
            log(`  Inserted new product: "${displayTitle}" (slug: ${slug})`);
            inserted++;
          }
        } catch (err) {
          failed++;
          const msg = `Product ${wcp.id} (${wcp.name}): ${String(err)}`;
          if (errors.length < 30) errors.push(msg);
          log(`  ERROR: ${msg}`);
        }
      }

      page++;
      if (pageProducts.length < 100) hasMore = false;
    }
  } catch (err) {
    const msg = `Fatal sync error: ${String(err)}`;
    errors.push(msg);
    log(`FATAL: ${msg}`);
  }

  if (logId) {
    await supabase.from("supplier_sync_logs").update({
      completed_at: new Date().toISOString(),
      products_fetched: fetched,
      products_inserted: inserted,
      products_updated: updated,
      products_failed: failed,
      error_messages: errors.length > 0 ? errors : null,
      supplier_api_response: { url: conn.api_url, markup: conn.markup_percentage },
      debug_logs: debugLogs,
    }).eq("id", logId);
  }

  await supabase.from("supplier_connections").update({ last_synced_at: new Date().toISOString() }).eq("id", connectionId);

  log(`Sync complete: fetched=${fetched} inserted=${inserted} updated=${updated} failed=${failed}`);

  return {
    success: errors.length === 0 || inserted + updated > 0,
    logId,
    connectionId,
    connectionName: conn.name,
    productsFetched: fetched,
    productsInserted: inserted,
    productsUpdated: updated,
    productsFailed: failed,
    errors,
    debugLogs,
  };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({})) as {
      connectionId?: string;
      syncAll?: boolean;
      triggeredBy?: string;
    };

    const triggeredBy = body.triggeredBy ?? "manual";
    const results: SyncResult[] = [];

    if (body.syncAll || (!body.connectionId)) {
      const { data: connections } = await supabase
        .from("supplier_connections").select("id").eq("is_active", true);

      for (const conn of connections ?? []) {
        const result = await syncConnection(supabase, conn.id, triggeredBy);
        results.push(result);
      }

      const totals = results.reduce(
        (acc, r) => ({
          productsFetched: acc.productsFetched + r.productsFetched,
          productsInserted: acc.productsInserted + r.productsInserted,
          productsUpdated: acc.productsUpdated + r.productsUpdated,
          errors: [...acc.errors, ...r.errors],
        }),
        { productsFetched: 0, productsInserted: 0, productsUpdated: 0, errors: [] as string[] }
      );

      return new Response(
        JSON.stringify({
          success: true,
          connectionsProcessed: results.length,
          productsFetched: totals.productsFetched,
          productsInserted: totals.productsInserted,
          productsUpdated: totals.productsUpdated,
          errors: totals.errors,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await syncConnection(supabase, body.connectionId!, triggeredBy);

    return new Response(
      JSON.stringify({
        success: result.success,
        logId: result.logId,
        productsFetched: result.productsFetched,
        productsInserted: result.productsInserted,
        productsUpdated: result.productsUpdated,
        productsFailed: result.productsFailed,
        errors: result.errors,
        debugLogs: result.debugLogs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err), productsFetched: 0, productsInserted: 0, productsUpdated: 0, errors: [String(err)] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── OpenAI helper ──────────────────────────────────────────────────────────────

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  maxTokens = 500,
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return ((data.choices?.[0]?.message?.content as string) ?? "").trim();
}

// ── Content generators ─────────────────────────────────────────────────────────

async function generateShortDescription(
  name: string, brand: string, category: string, weight: string,
): Promise<string> {
  const text = await callOpenAI([
    {
      role: "system",
      content:
        "You are a UK ecommerce copywriter for a Malayali grocery store serving the UK diaspora. Write natural, appealing product copy targeting Malayali customers. UK English only. No health claims.",
    },
    {
      role: "user",
      content: `Write a short product listing description (max 150 characters) for:

Product: ${name}
Brand: ${brand || "Unknown"}
Category: ${category || "Grocery"}
${weight ? `Weight/Size: ${weight}` : ""}

Target: Malayali customers in the UK looking for Kerala grocery products.
Requirements: One sentence, UK English, highlight quality or origin, no health claims.
Return only the description text, nothing else.`,
    },
  ], 80);
  return text.slice(0, 150);
}

async function generateFullDescription(
  name: string, brand: string, category: string, weight: string,
): Promise<string> {
  return await callOpenAI([
    {
      role: "system",
      content:
        "You are a UK ecommerce copywriter for a Malayali grocery store targeting Kerala diaspora in the UK. Write engaging, SEO-friendly HTML product descriptions. UK English. No health claims. No invented nutritional facts.",
    },
    {
      role: "user",
      content: `Write a product description for:

Product: ${name}
Brand: ${brand || "Unknown"}
Category: ${category || "Grocery"}
${weight ? `Weight/Size: ${weight}` : ""}

Target audience: Malayali / Kerala diaspora in the UK searching for authentic Kerala groceries online.

Requirements:
- 300–600 words
- UK English, SEO-friendly
- Reference authentic Kerala/South Indian use where relevant
- No health claims, no invented nutritional data

Use this exact HTML structure:
<p>[Brief product overview]</p>

<h3>Key Features</h3>
<ul>
<li>[Feature 1]</li>
<li>[Feature 2]</li>
<li>[Feature 3]</li>
<li>[Feature 4]</li>
</ul>

<h3>Ideal For</h3>
<ul>
<li>[Use case 1]</li>
<li>[Use case 2]</li>
<li>[Use case 3]</li>
</ul>

<p>[Closing sentence about quality/brand/delivery]</p>

Return only the HTML content, nothing else.`,
    },
  ], 900);
}

async function generateSEO(
  name: string, brand: string, category: string, weight: string, fullDesc: string,
): Promise<{
  seo_title: string; seo_description: string; seo_keywords: string;
  tags: string; slug: string;
}> {
  const raw = await callOpenAI([
    {
      role: "system",
      content:
        "You are a UK SEO specialist for a Malayali grocery store targeting Kerala diaspora in the UK. Return valid JSON only — no markdown, no code fences.",
    },
    {
      role: "user",
      content: `Generate SEO metadata for:

Product: ${name}
Brand: ${brand || "Unknown"}
Category: ${category || "Grocery"}
${weight ? `Weight/Size: ${weight}` : ""}
Description excerpt: ${fullDesc ? fullDesc.replace(/<[^>]+>/g, " ").slice(0, 250) : ""}

Target audience: Malayali customers in the UK searching for Kerala grocery products.

Return JSON with exactly these fields:
{
  "seo_title": "50-60 chars — brand + product + UK context, e.g. Homely Coconut Oil 1L | Kerala Grocery UK",
  "seo_description": "150-160 chars — include product, brand, UK delivery, Kerala context",
  "seo_keywords": "8-12 comma-separated keywords including brand name, product name, category, UK, Kerala, Malayali",
  "tags": "comma-separated product tags for internal search (product type, category, brand, cuisine type)",
  "slug": "url-friendly lowercase slug e.g. homely-coconut-oil-1l"
}

Return only valid JSON, no markdown.`,
    },
  ], 400);

  const makeSlug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    const p = JSON.parse(raw);
    return {
      seo_title:       String(p.seo_title       || "").slice(0, 60),
      seo_description: String(p.seo_description || "").slice(0, 160),
      seo_keywords:    String(p.seo_keywords     || ""),
      tags:            String(p.tags             || ""),
      slug:            makeSlug(String(p.slug || `${brand}-${name}`)),
    };
  } catch {
    return {
      seo_title:       `${name} | Kerala Grocery UK`.slice(0, 60),
      seo_description: `Buy ${name} online from PocketGrocery UK. Fast delivery across the UK.`.slice(0, 160),
      seo_keywords:    [name, brand, category, "kerala grocery uk", "malayali grocery"].filter(Boolean).join(", ").toLowerCase(),
      tags:            [name, brand, category].filter(Boolean).join(", ").toLowerCase(),
      slug:            makeSlug(`${brand}-${name}`),
    };
  }
}

// ── Process one job ─────────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function processJob(supabase: any, job: {
  id: string; product_id: string; action: string;
}): Promise<void> {
  // Claim the job atomically
  const { error: claimErr } = await supabase
    .from("ai_content_queue")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.id)
    .eq("status", "pending");

  if (claimErr) throw claimErr;

  // Fetch product context
  const { data: product, error: productErr } = await supabase
    .from("products")
    .select("id, name, brand, category_id, weight_grams, unit")
    .eq("id", job.product_id)
    .maybeSingle();

  if (productErr || !product) {
    throw new Error(`Product not found: ${job.product_id}`);
  }

  // Fetch category name
  let categoryName = "";
  if (product.category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("name")
      .eq("id", product.category_id)
      .maybeSingle();
    categoryName = cat?.name ?? "";
  }

  // Build weight label
  const weightLabel = product.weight_grams
    ? (product.weight_grams >= 1000
        ? `${(product.weight_grams / 1000).toFixed(product.weight_grams % 1000 === 0 ? 0 : 1)}${product.unit || "kg"}`
        : `${product.weight_grams}${product.unit || "g"}`)
    : (product.unit || "");

  const { action } = job;
  const updates: Record<string, string> = {};
  const generatedFields: Record<string, string> = {};

  // Short description
  if (action === "short_description" || action === "everything") {
    const val = await generateShortDescription(
      product.name, product.brand || "", categoryName, weightLabel,
    );
    updates.short_description = val;
    generatedFields.short_description = val;
  }

  // Full description
  if (action === "full_description" || action === "everything") {
    const val = await generateFullDescription(
      product.name, product.brand || "", categoryName, weightLabel,
    );
    updates.description = val;
    generatedFields.full_description = val;
  }

  // SEO
  if (action === "seo" || action === "everything") {
    const seo = await generateSEO(
      product.name, product.brand || "", categoryName, weightLabel,
      updates.description || "",
    );
    updates.seo_title       = seo.seo_title;
    updates.seo_description = seo.seo_description;
    updates.seo_keywords    = seo.seo_keywords;
    updates.tags            = seo.tags;
    Object.assign(generatedFields, seo);
  }

  // Save to product
  if (Object.keys(updates).length > 0) {
    await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", job.product_id);
  }

  // Mark complete
  await supabase
    .from("ai_content_queue")
    .update({
      status:           "completed",
      completed_at:     new Date().toISOString(),
      generated_fields: generatedFields,
    })
    .eq("id", job.id);
}

// ── Main handler ─────────────────────────────────────────────────────────────────

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

    // Auth: verify admin
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reset stale jobs first
    await supabase.rpc("reset_stale_ai_jobs");

    // Parse optional batch scope
    let batchId: string | null = null;
    try {
      const body = await req.json();
      batchId = body?.batch_id ?? null;
    } catch { /* no body */ }

    // Process up to 50 pending jobs per invocation (Supabase ~150s limit)
    const MAX_JOBS = 50;
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < MAX_JOBS; i++) {
      // Fetch next pending job
      const query = supabase
        .from("ai_content_queue")
        .select("id, product_id, action")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1);

      if (batchId) query.eq("batch_id", batchId);

      const { data: jobs } = await query;
      if (!jobs || jobs.length === 0) break;

      const job = jobs[0] as { id: string; product_id: string; action: string };

      try {
        await processJob(supabase, job);
        processed++;
      } catch (err) {
        console.error(`[ai-content-worker] job ${job.id} failed:`, err);
        await supabase
          .from("ai_content_queue")
          .update({
            status:        "failed",
            error_message: err instanceof Error ? err.message : String(err),
            completed_at:  new Date().toISOString(),
          })
          .eq("id", job.id);
        failed++;
      }

      // Small delay to avoid hammering OpenAI rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    // Check remaining
    const remainingQuery = supabase
      .from("ai_content_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (batchId) remainingQuery.eq("batch_id", batchId);
    const { count: remaining } = await remainingQuery;

    return new Response(
      JSON.stringify({ success: true, processed, failed, remaining: remaining ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ai-content-worker] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

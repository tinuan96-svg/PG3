import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CATEGORIES = [
  "Rice", "Dals", "Flours", "Spices", "Masalas", "Oils", "Pickles",
  "Snacks", "Sweets", "Tea & Coffee", "Fryums", "Instant Foods",
  "Vegetables", "Fruits", "Household", "Personal Care", "Beverages", "Other",
];

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Auth check
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // eslint — admin check via user_profiles
    const { data: profile } = await admin
      .from("user_profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!["admin", "super_admin"].includes((profile as { role?: string } | null)?.role ?? "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body: can process a single media_id or process next queued job
    const body = await req.json().catch(() => ({}));
    let mediaId: string | null = body.media_id ?? null;
    let queueJobId: string | null = null;

    if (!mediaId) {
      // Claim the next pending job from the queue
      const { data: job } = await admin
        .from("media_ai_queue")
        .select("id, media_id")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!job) {
        return new Response(JSON.stringify({ done: true, message: "No pending jobs" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      queueJobId = job.id;
      mediaId = job.media_id;

      // Claim
      await admin
        .from("media_ai_queue")
        .update({ status: "processing", started_at: new Date().toISOString() })
        .eq("id", queueJobId);
    }

    // Load the media record
    const { data: media, error: mediaErr } = await admin
      .from("media_library")
      .select("id, public_url, file_name, ai_status")
      .eq("id", mediaId)
      .maybeSingle();

    if (mediaErr || !media) {
      return new Response(JSON.stringify({ error: "Media record not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as processing
    await admin.from("media_library").update({ ai_status: "processing" }).eq("id", mediaId);

    let result: Record<string, unknown>;

    if (!openaiKey) {
      // Fallback: generate metadata from filename only (no OpenAI)
      const base = media.file_name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      result = {
        brand: null,
        product_name: base,
        weight: null,
        category: "Other",
        display_name: base,
        seo_filename: toSlug(base) + ".webp",
        keywords: [base.toLowerCase()],
        alt_text: base,
        title: base,
        description: base,
        confidence_score: 40,
      };
    } else {
      // Use OpenAI Vision gpt-4o-mini with detail:low for cost efficiency
      const prompt = `You are a product metadata extractor for a South Asian / Kerala grocery store.

Analyse this product image and extract the following. Return ONLY valid JSON — no markdown, no explanation.

Rules:
- Extract text VISIBLE on the packaging. Never guess or hallucinate.
- brand: The manufacturer/brand name printed on the pack (e.g. "Double Horse", "Eastern", "Nirapara").
- product_name: The product name WITHOUT brand and WITHOUT weight (e.g. "Corn Puttu Podi", "Rose Matta Rice").
- weight: Weight or volume on the pack (e.g. "500g", "1kg", "5L"). null if not visible.
- category: Pick ONE from: ${CATEGORIES.join(", ")}
- confidence_score: Integer 0–100 reflecting how readable the pack text was.
- keywords: Array of 4–8 lowercase SEO keywords relevant to the product.
- alt_text: Descriptive alt text for SEO (max 120 chars, include brand+product+weight+category).
- title: Short image title (brand + product + weight).
- description: 1–2 sentence product description from what is visible on the pack only.

Return JSON in this exact shape:
{
  "brand": string | null,
  "product_name": string | null,
  "weight": string | null,
  "category": string,
  "confidence_score": number,
  "keywords": string[],
  "alt_text": string,
  "title": string,
  "description": string
}`;

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: media.public_url, detail: "low" } },
              ],
            },
          ],
        }),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        throw new Error(`OpenAI error ${openaiRes.status}: ${errText}`);
      }

      const openaiData = await openaiRes.json();
      const raw = openaiData.choices?.[0]?.message?.content ?? "{}";

      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(cleaned); } catch { parsed = {}; }

      result = parsed;
    }

    // Build display_name and seo_filename
    const brand = (result.brand as string | null) ?? null;
    const productName = (result.product_name as string | null) ?? null;
    const weight = (result.weight as string | null) ?? null;

    const parts = [brand, productName, weight].filter(Boolean)
    const displayName = parts.join(" ") || media.file_name.replace(/\.[^.]+$/, "");
    const seoFilename = toSlug(displayName) + ".webp";

    const update: Record<string, unknown> = {
      brand,
      product_name: productName,
      weight,
      category: (result.category as string) ?? "Other",
      display_name: displayName,
      seo_filename: seoFilename,
      keywords: (result.keywords as string[]) ?? [],
      alt_text: (result.alt_text as string) ?? displayName,
      title: (result.title as string) ?? displayName,
      description: (result.description as string) ?? null,
      confidence_score: typeof result.confidence_score === "number" ? result.confidence_score : null,
      ai_status: "completed",
      ai_error: null,
      ai_processed_at: new Date().toISOString(),
    };

    await admin.from("media_library").update(update).eq("id", mediaId);

    // Complete queue job
    if (queueJobId) {
      await admin
        .from("media_ai_queue")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", queueJobId);
    }

    return new Response(
      JSON.stringify({ success: true, media_id: mediaId, display_name: displayName, confidence_score: update.confidence_score }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("[analyze-media-image]", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

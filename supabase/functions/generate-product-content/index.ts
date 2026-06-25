import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Action = "short_description" | "full_description" | "seo" | "everything";

interface GenerateRequest {
  action: Action;
  productName: string;
  brand: string;
  category: string;
  weight?: string;
  description?: string;
  productId?: string;
}

interface GenerateResult {
  short_description?: string;
  full_description?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  tags?: string;
  slug?: string;
}

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
    throw new Error(`OpenAI API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return ((data.choices?.[0]?.message?.content as string) ?? "").trim();
}

// ── Short description ─────────────────────────────────────────────────────────

async function generateShortDescription(
  productName: string,
  brand: string,
  category: string,
  weight: string,
): Promise<string> {
  const text = await callOpenAI([
    {
      role: "system",
      content:
        "You are a UK ecommerce copywriter for a Malayali grocery store targeting Kerala diaspora in the UK. Write natural, appealing product copy. UK English. No health claims.",
    },
    {
      role: "user",
      content: `Write a short product listing description (max 150 characters) for:

Product: ${productName}
Brand: ${brand || "Unknown"}
Category: ${category || "Grocery"}
${weight ? `Weight/Size: ${weight}` : ""}

Target: Malayali customers in the UK looking for Kerala grocery products.
Requirements: One sentence, UK English, highlight quality or Kerala origin, no health claims.
Return only the description text, nothing else.`,
    },
  ], 80);
  return text.slice(0, 150);
}

// ── Full description ──────────────────────────────────────────────────────────

async function generateFullDescription(
  productName: string,
  brand: string,
  category: string,
  weight: string,
): Promise<string> {
  return await callOpenAI([
    {
      role: "system",
      content:
        "You are a UK ecommerce copywriter for a Malayali grocery store targeting Kerala diaspora in the UK. Write engaging, SEO-friendly HTML product descriptions. UK English. No health claims. No invented nutritional facts.",
    },
    {
      role: "user",
      content: `Write a full product description for:

Product: ${productName}
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

<p>[Closing sentence about quality/brand/UK delivery]</p>

Return only the HTML content, nothing else.`,
    },
  ], 900);
}

// ── SEO metadata ──────────────────────────────────────────────────────────────

async function generateSEO(
  productName: string,
  brand: string,
  category: string,
  weight: string,
  description: string,
): Promise<{
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  tags: string;
  slug: string;
}> {
  const raw = await callOpenAI([
    {
      role: "system",
      content:
        "You are a UK SEO specialist for a Malayali grocery store targeting Kerala diaspora in the UK. Return valid JSON only — no markdown, no code fences.",
    },
    {
      role: "user",
      content: `Generate SEO metadata for this product:

Product: ${productName}
Brand: ${brand || "Unknown"}
Category: ${category || "Grocery"}
${weight ? `Weight/Size: ${weight}` : ""}
Description excerpt: ${description ? description.replace(/<[^>]+>/g, " ").slice(0, 250) : ""}

Target audience: Malayali customers in the UK searching for Kerala grocery products.

Return a JSON object with exactly these fields:
{
  "seo_title": "50-60 chars — brand + product + UK context, e.g. Homely Coconut Oil 1L | Kerala Grocery UK",
  "seo_description": "150-160 chars — include product, brand, UK delivery, Kerala context",
  "seo_keywords": "8-12 comma-separated keywords: brand, product, category, UK, Kerala, Malayali variants",
  "tags": "comma-separated product tags for internal search (product type, category, brand, cuisine)",
  "slug": "url-friendly lowercase slug e.g. homely-coconut-oil-1l"
}

Return only valid JSON, no markdown.`,
    },
  ], 400);

  const makeSlug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    const parsed = JSON.parse(raw);
    return {
      seo_title:       String(parsed.seo_title       || "").slice(0, 60),
      seo_description: String(parsed.seo_description || "").slice(0, 160),
      seo_keywords:    String(parsed.seo_keywords     || ""),
      tags:            String(parsed.tags             || ""),
      slug:            makeSlug(String(parsed.slug    || `${brand}-${productName}`)),
    };
  } catch {
    return {
      seo_title:       `${productName} | Kerala Grocery UK`.slice(0, 60),
      seo_description: `Buy ${productName} online from PocketGrocery UK. Fast delivery across the UK.`.slice(0, 160),
      seo_keywords:    [productName, brand, category, "kerala grocery uk", "malayali grocery"].filter(Boolean).join(", ").toLowerCase(),
      tags:            [productName, brand, category].filter(Boolean).join(", ").toLowerCase(),
      slug:            makeSlug(`${brand}-${productName}`),
    };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

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

    // Auth: require admin
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: GenerateRequest = await req.json();
    const { action, productName, brand, category, weight, description, productId } = body;

    if (!productName?.trim()) {
      return new Response(JSON.stringify({ error: "productName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result: GenerateResult = {};

    if (action === "short_description" || action === "everything") {
      result.short_description = await generateShortDescription(
        productName, brand || "", category || "", weight || "",
      );
    }

    if (action === "full_description" || action === "everything") {
      result.full_description = await generateFullDescription(
        productName, brand || "", category || "", weight || "",
      );
    }

    if (action === "seo" || action === "everything") {
      const seoData = await generateSEO(
        productName, brand || "", category || "", weight || "",
        description || result.full_description || "",
      );
      result.seo_title       = seoData.seo_title;
      result.seo_description = seoData.seo_description;
      result.seo_keywords    = seoData.seo_keywords;
      result.tags            = seoData.tags;
      result.slug            = seoData.slug;
    }

    // Audit log — non-blocking
    if (productId) {
      EdgeRuntime.waitUntil(
        supabase.from("ai_content_logs").insert({
          product_id:    productId,
          admin_user_id: user.id,
          content_type:  action,
          product_name:  productName,
        }).then(() => {}),
      );
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-product-content] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

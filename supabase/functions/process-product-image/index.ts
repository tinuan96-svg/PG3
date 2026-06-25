import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * PocketGrocery — process-product-image Edge Function
 *
 * Receives a job_id (pre-created in image_processing_jobs).
 * Downloads the source image, processes it using canvas APIs (no Sharp in Deno),
 * uploads 3 sizes to Supabase Storage, and updates DB records.
 *
 * Processing rules (strictly enforced):
 *   - ONLY removes background (flood-fill from corners — never touches product pixels)
 *   - ONLY resizes, centers, adds padding, adds subtle shadow
 *   - NEVER regenerates, repaints, or alters product packaging pixels
 *   - NEVER calls OpenAI for image generation
 *   - OpenAI (if enabled in settings) is ONLY used for brand/weight/category/SEO text extraction
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "product-images";

interface JobRow {
  id: string;
  product_id: string;
  product_image_id: string | null;
  original_url: string;
  retry_count: number;
  metadata: Record<string, unknown> | null;
}

interface Settings {
  output_quality: number;
  shadow_strength: number;
  padding_pct: number;
  bg_threshold: number;
  main_size_px: number;
  medium_size_px: number;
  thumb_size_px: number;
  keep_original: boolean;
  replace_storefront_image: boolean;
  enable_openai_metadata: boolean;
  openai_fields: string[];
}

const DEFAULT_SETTINGS: Settings = {
  output_quality: 85,
  shadow_strength: 0.15,
  padding_pct: 10,
  bg_threshold: 30,
  main_size_px: 1200,
  medium_size_px: 600,
  thumb_size_px: 300,
  keep_original: true,
  replace_storefront_image: true,
  enable_openai_metadata: false,
  openai_fields: ["brand", "weight", "category", "seo"],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    const body = await req.json();
    const jobId: string | null = body.job_id ?? null;
    const imageUrl: string | null = body.image_url ?? null;
    const productId: string | null = body.product_id ?? null;

    if (!imageUrl || !productId) {
      return json({ error: "image_url and product_id are required" }, 400);
    }

    // ── Load settings ───────────────────────────────────────────────────────
    const { data: settingsRow } = await db
      .from("image_processing_settings")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .maybeSingle();

    const settings: Settings = { ...DEFAULT_SETTINGS, ...(settingsRow ?? {}) };

    // ── Create or claim job ─────────────────────────────────────────────────
    let jid = jobId;
    if (!jid) {
      const { data: newJob } = await db
        .from("image_processing_jobs")
        .insert({
          product_id: productId,
          original_url: imageUrl,
          status: "processing",
          pipeline_stage: "download",
          processing_engine: "canvas",
          processing_started_at: new Date().toISOString(),
        })
        .select("id")
        .maybeSingle();
      jid = newJob?.id ?? crypto.randomUUID();
    } else {
      await db.from("image_processing_jobs").update({
        status: "processing",
        pipeline_stage: "download",
        processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", jid);
    }

    // ── Download source image ───────────────────────────────────────────────
    let imageBuffer: ArrayBuffer;
    try {
      const res = await fetch(imageUrl, { headers: { "User-Agent": "PocketGrocery/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) {
        throw new Error(`Not an image: ${contentType}`);
      }
      imageBuffer = await res.arrayBuffer();
      if (imageBuffer.byteLength < 5 * 1024) throw new Error("Image too small (< 5 KB)");
      if (imageBuffer.byteLength > 25 * 1024 * 1024) throw new Error("Image too large (> 25 MB)");
    } catch (err) {
      await failJob(db, jid!, null, "download", String(err));
      return json({ success: false, error: String(err) }, 422);
    }

    await updateStage(db, jid!, "processing");

    // ── Process image via Canvas API ────────────────────────────────────────
    let mainBuf: Uint8Array;
    let mediumBuf: Uint8Array;
    let thumbBuf: Uint8Array;

    try {
      const blob = new Blob([imageBuffer]);
      const bitmap = await createImageBitmap(blob);

      // Determine background colour from corners and remove it
      const nobgBitmap = await removeBackground(bitmap, settings.bg_threshold);

      // Render 3 sizes
      [mainBuf, mediumBuf, thumbBuf] = await Promise.all([
        renderSize(nobgBitmap, settings.main_size_px, settings),
        renderSize(nobgBitmap, settings.medium_size_px, settings),
        renderSize(nobgBitmap, settings.thumb_size_px, settings),
      ]);

      nobgBitmap.close();
      bitmap.close();
    } catch (err) {
      await failJob(db, jid!, null, "processing", String(err));
      return json({ success: false, error: String(err) }, 500);
    }

    // ── Upload ──────────────────────────────────────────────────────────────
    const ts = Date.now();
    const base = `processed/${productId}/${ts}`;

    await updateStage(db, jid!, "upload_main");
    const mainPath = `${base}_1200.webp`;
    const { error: mainErr } = await supabase.storage
      .from(BUCKET)
      .upload(mainPath, mainBuf, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
    if (mainErr) {
      await failJob(db, jid!, null, "upload_main", mainErr.message);
      return json({ success: false, error: mainErr.message }, 500);
    }
    const processedUrl = supabase.storage.from(BUCKET).getPublicUrl(mainPath).data.publicUrl;

    await updateStage(db, jid!, "upload_medium");
    let mediumUrl = processedUrl;
    const medPath = `${base}_600.webp`;
    const { error: medErr } = await supabase.storage
      .from(BUCKET)
      .upload(medPath, mediumBuf, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
    if (!medErr) {
      mediumUrl = supabase.storage.from(BUCKET).getPublicUrl(medPath).data.publicUrl;
    }

    await updateStage(db, jid!, "upload_thumbnail");
    let thumbnailUrl = processedUrl;
    const thumbPath = `${base}_300.webp`;
    const { error: thumbErr } = await supabase.storage
      .from(BUCKET)
      .upload(thumbPath, thumbBuf, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
    if (!thumbErr) {
      thumbnailUrl = supabase.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl;
    }

    // ── OpenAI metadata extraction (optional, off by default) ───────────────
    let extractedMeta: Record<string, unknown> = {};
    if (settings.enable_openai_metadata) {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiKey && settings.openai_fields.length > 0) {
        try {
          extractedMeta = await extractMetadataWithOpenAI(
            processedUrl,
            settings.openai_fields,
            openaiKey
          );
        } catch (e) {
          console.warn("[process-product-image] OpenAI metadata extraction failed:", e);
        }
      }
    }

    // ── Update DB ───────────────────────────────────────────────────────────
    await updateStage(db, jid!, "update_records");
    const duration = Date.now() - startTime;

    // Update products
    const productUpdate: Record<string, unknown> = {
      processed_image_url: processedUrl,
      thumbnail_url: thumbnailUrl,
      updated_at: new Date().toISOString(),
    };
    if (settings.keep_original) productUpdate.original_image_url = imageUrl;
    if (settings.replace_storefront_image) productUpdate.image = processedUrl;
    if (extractedMeta.brand) productUpdate.brand = extractedMeta.brand;
    if (extractedMeta.weight_grams) productUpdate.weight_grams = extractedMeta.weight_grams;
    if (extractedMeta.category_id) productUpdate.category_id = extractedMeta.category_id;
    if (extractedMeta.seo_title) productUpdate.seo_title = extractedMeta.seo_title;
    if (extractedMeta.seo_description) productUpdate.seo_description = extractedMeta.seo_description;

    await db.from("products").update(productUpdate).eq("id", productId);

    // Complete job
    await db.from("image_processing_jobs").update({
      pipeline_stage: "completed",
      status: "completed",
      processed_url: processedUrl,
      medium_url: mediumUrl,
      thumbnail_url: thumbnailUrl,
      processing_completed_at: new Date().toISOString(),
      duration_ms: duration,
      metadata: Object.keys(extractedMeta).length > 0 ? extractedMeta : null,
      updated_at: new Date().toISOString(),
    }).eq("id", jid);

    return json({
      success: true,
      job_id: jid,
      processed_url: processedUrl,
      medium_url: mediumUrl,
      thumbnail_url: thumbnailUrl,
      original_url: imageUrl,
      stage: "completed",
      duration_ms: duration,
      engine: "canvas",
      metadata: extractedMeta,
    });
  } catch (err) {
    console.error("[process-product-image] Unhandled error:", err);
    return json({ success: false, error: String(err) }, 500);
  }
});

// ─── Background removal ────────────────────────────────────────────────────────

async function removeBackground(
  bitmap: ImageBitmap,
  threshold: number
): Promise<ImageBitmap> {
  const { width, height } = bitmap;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // Sample corners to determine background colour
  function px(x: number, y: number) {
    const i = (y * width + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  }

  const corners = [
    px(0, 0), px(width - 1, 0), px(0, height - 1), px(width - 1, height - 1),
  ];
  const bg = {
    r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
    g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
    b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
    a: Math.round(corners.reduce((s, c) => s + c.a, 0) / 4),
  };

  // If background is already transparent, skip
  if (bg.a < 128) return bitmap;

  // Flood fill from corners
  const visited = new Uint8Array(width * height);
  const queue: [number, number][] = [];

  function seed(x: number, y: number) {
    const p = px(x, y);
    if (
      !visited[y * width + x] &&
      p.a > 128 &&
      Math.abs(p.r - bg.r) <= threshold &&
      Math.abs(p.g - bg.g) <= threshold &&
      Math.abs(p.b - bg.b) <= threshold
    ) {
      visited[y * width + x] = 1;
      queue.push([x, y]);
    }
  }
  seed(0, 0);
  seed(width - 1, 0);
  seed(0, height - 1);
  seed(width - 1, height - 1);

  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  while (queue.length > 0) {
    const [x, y] = queue.pop()!;
    const i = (y * width + x) * 4;
    data[i + 3] = 0; // erase — set alpha to 0
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const ni = ny * width + nx;
      if (visited[ni]) continue;
      const p = px(nx, ny);
      if (
        p.a > 128 &&
        Math.abs(p.r - bg.r) <= threshold &&
        Math.abs(p.g - bg.g) <= threshold &&
        Math.abs(p.b - bg.b) <= threshold
      ) {
        visited[ni] = 1;
        queue.push([nx, ny]);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return await createImageBitmap(canvas.transferToImageBitmap());
}

// ─── Render on white canvas at given size ─────────────────────────────────────

async function renderSize(
  product: ImageBitmap,
  canvasSize: number,
  settings: Settings
): Promise<Uint8Array> {
  const contentFrac = 1 - (settings.padding_pct / 100) * 2;
  const contentSize = Math.round(canvasSize * contentFrac);

  // Compute scaled product dimensions preserving aspect ratio
  const aspect = product.width / product.height;
  let pw: number, ph: number;
  if (aspect >= 1) {
    pw = contentSize;
    ph = Math.round(contentSize / aspect);
  } else {
    ph = contentSize;
    pw = Math.round(contentSize * aspect);
  }

  const left = Math.round((canvasSize - pw) / 2);
  const top = Math.round((canvasSize - ph) / 2);

  const canvas = new OffscreenCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Drop shadow
  if (settings.shadow_strength > 0 && canvasSize >= 300) {
    const offsetY = Math.round(canvasSize * 0.015);
    const blur = Math.max(2, Math.round(canvasSize * 0.02));
    const alpha = settings.shadow_strength;
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${alpha})`;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = offsetY;
    ctx.drawImage(product, left, top, pw, ph);
    ctx.restore();
  }

  // Product (sharp, no shadow)
  ctx.drawImage(product, left, top, pw, ph);

  const blob = await canvas.convertToBlob({ type: "image/webp", quality: settings.output_quality / 100 });
  return new Uint8Array(await blob.arrayBuffer());
}

// ─── OpenAI metadata extraction ───────────────────────────────────────────────

async function extractMetadataWithOpenAI(
  imageUrl: string,
  fields: string[],
  apiKey: string
): Promise<Record<string, unknown>> {
  const fieldDescriptions: Record<string, string> = {
    brand:    "the brand name printed on the packaging (exact text, no modification)",
    weight:   "the product weight or volume in grams (numeric only, convert ml to g if needed)",
    category: "the most appropriate grocery category slug (e.g. spices, rice-grains, snacks, oils, pickles)",
    seo:      "a 60-char SEO title and 155-char SEO description for this product",
  };

  const requested = fields.filter((f) => fieldDescriptions[f]);
  if (requested.length === 0) return {};

  const prompt = `You are a grocery product data extractor. Look at this product image.
Extract ONLY the following from the physical packaging — do not infer or guess:
${requested.map((f) => `- ${f}: ${fieldDescriptions[f]}`).join("\n")}

Respond with valid JSON only. Example:
{"brand":"Nirapara","weight":1000,"category":"rice-grains","seo_title":"Nirapara Matta Rice 1kg","seo_description":"Authentic Kerala red matta rice, 1kg pack by Nirapara."}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  return JSON.parse(match[0]);
}

// ─── DB helpers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateStage(db: any, jobId: string, stage: string) {
  await db.from("image_processing_jobs")
    .update({ pipeline_stage: stage, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function failJob(db: any, jobId: string, imageId: string | null, stage: string, error: string) {
  await db.from("image_processing_jobs").update({
    status: "failed",
    pipeline_stage: stage,
    error_message: error,
    processing_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);

  if (imageId) {
    await db.from("product_images").update({
      processing_status: "failed",
      processing_error: error,
    }).eq("id", imageId);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

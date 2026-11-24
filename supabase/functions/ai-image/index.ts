// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

const DEFAULT_NVIDIA_MODEL = "black-forest-labs/flux.1-schnell";
const VALID_STYLES = ["Zardozi", "Zari", "Resham", "Floral", "Geometric", "Paisley"] as const;
type ValidStyle = typeof VALID_STYLES[number];

const STYLE_DESCRIPTIONS: Record<ValidStyle, string> = {
  Zardozi: "ornate metallic zardozi gold bullion and french wire embroidery",
  Zari: "fine tilla metallic zari threadwork on silk",
  Resham: "vibrant resham silk thread satin-stitch embroidery",
  Floral: "botanical floral mughal bloom embroidery with intricate petals",
  Geometric: "crisp symmetrical geometric tessellation jaali pattern",
  Paisley: "traditional kashmiri paisley boteh droplet motif",
};

function isSafePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const peoplePattern = /\b(celebrity|president|politician|trump|biden|modi|musk|actor|actress|influencer|selfie|face of|portrait of|photo of a person|man|woman|child|girl|boy)\b/i;
  const brandsPattern = /\b(logo|trademark|brand|nike|adidas|gucci|chanel|louis vuitton|prada|zara|h&m|dior|versace|rolex|apple|google)\b/i;
  const adultPattern = /\b(nsfw|nude|nudity|naked|porn|sexual|explicit|breasts|erotic)\b/i;
  const violentPattern = /\b(blood|gore|weapon|kill|murder|violence|gun|knife|stab|terror|bomb)\b/i;

  if (peoplePattern.test(lower)) return false;
  if (brandsPattern.test(lower)) return false;
  if (adultPattern.test(lower)) return false;
  if (violentPattern.test(lower)) return false;
  return true;
}

function sanitizeUserSubject(text: string): string {
  return text
    .replace(/\b(ignore (all )?previous instructions|system:|assistant:|user:)\b/gi, "")
    .replace(/[<>]/g, "")
    .trim();
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function generateSingleImage(
  apiKey: string,
  model: string,
  prompt: string,
  seed: number,
  timeoutMs = 45000
): Promise<Uint8Array> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const endpointUrl = model.startsWith("http")
    ? model
    : `https://ai.api.nvidia.com/v1/genai/${model}`;

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        prompt,
        width: 1024,
        height: 1024,
        steps: 4,
        seed,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`NVIDIA API returned HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const base64Str = data?.artifacts?.[0]?.base64 || data?.image;
    if (!base64Str) {
      throw new Error("Missing image artifact in NVIDIA response");
    }

    return base64ToUint8Array(base64Str);
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const nvidiaApiKey = Deno.env.get("NVIDIA_API_KEY");
  const nvidiaModel = Deno.env.get("NVIDIA_IMAGE_MODEL") || DEFAULT_NVIDIA_MODEL;

  if (!nvidiaApiKey) {
    return new Response(JSON.stringify({ error: "NVIDIA_API_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace(/Bearer /i, "").trim();
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid or expired session token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse request body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { prompt: rawPrompt, style, count = 2 } = body || {};

  // Input validation
  if (!rawPrompt || typeof rawPrompt !== "string" || rawPrompt.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Prompt is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (rawPrompt.length > 300) {
    return new Response(JSON.stringify({ error: "Prompt exceeds 300 characters limit" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!VALID_STYLES.includes(style as ValidStyle)) {
    return new Response(JSON.stringify({ error: "Invalid style. Must be one of Zardozi, Zari, Resham, Floral, Geometric, Paisley" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const requestedCount = Math.min(Math.max(Number(count) || 2, 1), 2);

  // Content safety check
  if (!isSafePrompt(rawPrompt)) {
    return new Response(JSON.stringify({ error: "Prompt contains disallowed content (real people, brand names, adult, or violence)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Quota evaluation: 6/day for registered users, 2/day for anonymous users
  const isAnonymous = user.is_anonymous === true || user.app_metadata?.provider === "anonymous";
  const dailyLimit = isAnonymous ? 2 : 6;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count: dailyCount, error: countError } = await supabaseAdmin
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "image")
    .gte("created_at", startOfDay.toISOString());

  if (countError) {
    return new Response(JSON.stringify({ error: "Failed to evaluate usage limits" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if ((dailyCount || 0) >= dailyLimit) {
    return new Response(
      JSON.stringify({
        error: "Daily limit reached",
        limit: dailyLimit,
        current: dailyCount,
        is_anonymous: isAnonymous,
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Construct final prompt
  const cleanSubject = sanitizeUserSubject(rawPrompt);
  const styleKeywords = STYLE_DESCRIPTIONS[style as ValidStyle];
  const finalPrompt = `${styleKeywords}, ${cleanSubject}, flat top-down textile motif, centered, highly detailed, plain solid background, no text, no people, no watermark`;

  // Run image generation in parallel
  const seeds = Array.from({ length: requestedCount }, () => Math.floor(Math.random() * 2147483647));
  const generationTasks = seeds.map((seed) =>
    generateSingleImage(nvidiaApiKey, nvidiaModel, finalPrompt, seed, 45000)
  );

  const settled = await Promise.allSettled(generationTasks);
  const successfulImages: Uint8Array[] = [];

  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      successfulImages.push(result.value);
    }
  }

  if (successfulImages.length === 0) {
    return new Response(JSON.stringify({ error: "Image generation failed. Please try again." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Upload each image to private bucket ai-motifs at {user_id}/{uuid}.png with user client
  const uploadResults: Array<{ storage_path: string; signed_url: string; prompt: string; style: string }> = [];

  for (const imgBytes of successfulImages) {
    const fileId = crypto.randomUUID();
    const storagePath = `${user.id}/${fileId}.png`;

    const { error: uploadError } = await supabaseUser.storage
      .from("ai-motifs")
      .upload(storagePath, imgBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      continue;
    }

    // Generate 1-hour signed URL (3600 seconds)
    const { data: signedData } = await supabaseUser.storage
      .from("ai-motifs")
      .createSignedUrl(storagePath, 3600);

    const signedUrl = signedData?.signedUrl || "";

    // Save motif record to motifs table
    await supabaseUser.from("motifs").insert({
      user_id: user.id,
      prompt: rawPrompt,
      style,
      storage_path: storagePath,
    });

    uploadResults.push({
      storage_path: storagePath,
      signed_url: signedUrl,
      prompt: rawPrompt,
      style,
    });
  }

  if (uploadResults.length === 0) {
    return new Response(JSON.stringify({ error: "Failed to store generated images" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Record 1 ai_usage entry after successful generation
  await supabaseAdmin.from("ai_usage").insert({
    user_id: user.id,
    kind: "image",
    prompt_tokens: 0,
    completion_tokens: 0,
  });

  return new Response(
    JSON.stringify({
      images: uploadResults,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

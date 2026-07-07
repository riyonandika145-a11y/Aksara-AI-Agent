// Worker tunggal: menangani route /api/* (dulunya Pages Functions),
// dan melempar semua request lain ke static assets hasil build Vite (folder dist/).

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/generate") {
      return handleGenerate(request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/generate-image") {
      return handleGenerateImage(request, env);
    }

    // Semua request lain (HTML, JS, CSS, gambar) dilayani sebagai static asset.
    return env.ASSETS.fetch(request);
  },
};

// ── /api/generate ────────────────────────────────────────────────────────
async function handleGenerate(request, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: "GEMINI_API_KEY_MISSING" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_BODY" }, 400);
  }

  const { prompt, json: wantJson = false } = body || {};
  if (!prompt || typeof prompt !== "string") {
    return json({ error: "PROMPT_REQUIRED" }, 400);
  }

  const upstream = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        ...(wantJson ? { generationConfig: { responseMimeType: "application/json" } } : {}),
      }),
    }
  );

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return json({ error: "GEMINI_ERROR", status: upstream.status, detail: data }, upstream.status);
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || "").join("\n").trim();

  return json({ text });
}

// ── /api/generate-image ──────────────────────────────────────────────────
// Pakai Cloudflare Workers AI (gratis, 10.000 neuron/hari) — bukan Gemini,
// supaya generate gambar tidak butuh billing sama sekali.
async function handleGenerateImage(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_BODY" }, 400);
  }

  const { prompt, aspectRatio = "1:1" } = body || {};
  if (!prompt || typeof prompt !== "string") {
    return json({ error: "PROMPT_REQUIRED" }, 400);
  }

  // FLUX butuh width/height eksplisit (kelipatan 8), bukan string aspect ratio.
  const dimensionMap = {
    "1:1": { width: 1024, height: 1024 },
    "4:5": { width: 896, height: 1120 },
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
  };
  const { width, height } = dimensionMap[aspectRatio] || dimensionMap["1:1"];

  try {
    const result = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt,
      width,
      height,
    });

    // Model ini mengembalikan { image: "<base64 tanpa prefix>" }
    if (!result?.image) {
      return json({ error: "NO_IMAGE" }, 502);
    }

    return json({ url: `data:image/jpeg;base64,${result.image}` });
  } catch (err) {
    return json({ error: "GEMINI_ERROR", status: 502, detail: String(err) }, 502);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────
async function fetchWithRetry(url, options, retries = 2, baseDelayMs = 700) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
        continue;
      }
    }
  }
  throw lastErr;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

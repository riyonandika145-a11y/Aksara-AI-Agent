// Cloudflare Pages Function — proxy khusus image generation (Gemini "Nano Banana").
// Sama seperti generate.js: API key hanya hidup di server.

export async function onRequestPost(context) {
  const { request, env } = context;
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

  const { prompt, aspectRatio = "1:1" } = body || {};
  if (!prompt || typeof prompt !== "string") {
    return json({ error: "PROMPT_REQUIRED" }, 400);
  }

  const upstream = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}. Aspect ratio: ${aspectRatio}.` }] }],
      }),
    }
  );

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return json({ error: "GEMINI_ERROR", status: upstream.status, detail: data }, upstream.status);
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData);
  if (!imagePart) {
    return json({ error: "NO_IMAGE" }, 502);
  }

  const { mimeType, data: base64 } = imagePart.inlineData;
  return json({ url: `data:${mimeType};base64,${base64}` });
}

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

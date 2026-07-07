// Client HANYA memanggil endpoint lokal (/api/...).
// API key Gemini tidak pernah ada di kode/browser sisi client.

export async function callGemini(prompt, { json = false } = {}) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, json }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Gemini API error (${res.status})`);
  }
  if (json) {
    return JSON.parse(String(data.text).replace(/```json|```/g, "").trim());
  }
  return data.text;
}

export async function callGeminiImage(prompt, { aspectRatio = "1:1" } = {}) {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Gemini Image error (${res.status})`);
  }
  return data.url;
}

export function friendlyError(e, fallback) {
  if (e?.message === "GEMINI_API_KEY_MISSING") {
    return "Belum ada API key Gemini. Tambahkan GEMINI_API_KEY di Environment Variables (Secret) Cloudflare Pages.";
  }
  if (e?.message === "IMAGE_GEN_ERROR") {
    return "Layanan pembuat gambar sedang bermasalah. Coba lagi sebentar lagi.";
  }
  if (e?.message === "NO_IMAGE") {
    return "Gagal membuat gambar. Coba ubah deskripsinya, lalu coba lagi.";
  }
  if (e?.message === "GEMINI_ERROR") {
    return "Gemini sedang bermasalah atau kuota harian habis. Coba lagi nanti.";
  }
  return fallback;
}

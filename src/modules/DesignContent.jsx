import React, { useState } from "react";
import { Palette, Image as ImageIcon, LayoutTemplate } from "lucide-react";
import { callGemini, callGeminiImage, friendlyError } from "../lib/geminiClient";
import { ModuleHeader, PrimaryButton, EmptyState, DraftCard, SkeletonLines } from "../components/Shared";

export default function DesignContent() {
  const [tab, setTab] = useState("concept");
  return (
    <div className="module">
      <ModuleHeader icon={<Palette size={20} />} title="Desain Konten" desc="Ide visual & caption, gambar AI, dan template layout siap pakai." />
      <div className="pill-row" style={{ marginBottom: 20 }}>
        <button className={`pill ${tab === "concept" ? "pill-active" : ""}`} onClick={() => setTab("concept")}>
          Ide Visual & Caption
        </button>
        <button className={`pill ${tab === "image" ? "pill-active" : ""}`} onClick={() => setTab("image")}>
          Gambar AI
        </button>
        <button className={`pill ${tab === "template" ? "pill-active" : ""}`} onClick={() => setTab("template")}>
          Template Layout
        </button>
      </div>
      {tab === "concept" && <VisualConcept />}
      {tab === "image" && <AiImage />}
      {tab === "template" && <LayoutTemplates />}
    </div>
  );
}

function VisualConcept() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!brief.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const prompt = `Kamu creative director konten digital Indonesia berpengalaman.
Untuk brief: "${brief}", buat 3 konsep visual feed Instagram yang segar dan berbeda satu sama lain.
Balas HANYA JSON:
{"konsep":[{"judul_konsep":"...","deskripsi_visual":"komposisi, palet warna spesifik, mood visual, elemen utama","caption":"caption Instagram lengkap + 6-8 hashtag relevan"}]}`;
      const data = await callGemini(prompt, { json: true });
      setResult(data);
    } catch (e) {
      setError(friendlyError(e, "Gagal membuat konsep. Coba lagi sebentar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="work-grid">
      <div className="panel">
        <label className="field-label">Brief konten visual</label>
        <textarea
          className="textarea"
          placeholder="Contoh: promo diskon akhir bulan untuk kedai kopi"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={4}
        />
        <PrimaryButton onClick={generate} loading={loading} disabled={!brief.trim()}>
          Buat konsep
        </PrimaryButton>
      </div>
      <div className="panel result-panel">
        {error && <div className="error-banner">{error}</div>}
        {!result && !loading && !error && <EmptyState icon={<Palette size={28} />} text="Konsep visual & caption akan muncul di sini." />}
        {loading && <SkeletonLines />}
        {result?.konsep?.map((k, i) => (
          <DraftCard key={i} title={k.judul_konsep} text={k.caption}>
            <p className="visual-desc">{k.deskripsi_visual}</p>
            <hr className="divider" />
            <p className="prose">{k.caption}</p>
          </DraftCard>
        ))}
      </div>
    </div>
  );
}

function AiImage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("fotografi produk");
  const [ratio, setRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  const styles = ["fotografi produk", "ilustrasi flat", "minimalis", "warna cerah & playful"];
  const ratios = ["1:1", "4:5", "16:9", "9:16"];

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setImages([]);
    try {
      const enrichPrompt = `Expand this into a detailed, vivid image generation prompt in English for the style: ${style}. Description: "${prompt}". One paragraph only, no preamble.`;
      const enriched = await callGemini(enrichPrompt);
      const imageUrl = await callGeminiImage(enriched, { aspectRatio: ratio });
      setImages([{ description: enriched, url: imageUrl }]);
    } catch (e) {
      setError(friendlyError(e, "Gagal membuat gambar. Coba lagi sebentar lagi."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="work-grid">
      <div className="panel">
        <label className="field-label">Gaya visual</label>
        <div className="pill-row">
          {styles.map((s) => (
            <button key={s} className={`pill ${style === s ? "pill-active" : ""}`} onClick={() => setStyle(s)}>
              {s}
            </button>
          ))}
        </div>
        <label className="field-label">Rasio aspek</label>
        <div className="pill-row">
          {ratios.map((r) => (
            <button key={r} className={`pill ${ratio === r ? "pill-active" : ""}`} onClick={() => setRatio(r)}>
              {r}
            </button>
          ))}
        </div>
        <label className="field-label">Deskripsi gambar</label>
        <textarea
          className="textarea"
          placeholder="Contoh: secangkir kopi latte di atas meja kayu dengan cahaya pagi"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
        <PrimaryButton onClick={generate} loading={loading} disabled={!prompt.trim()}>
          Buat gambar
        </PrimaryButton>
        <p className="hint-text">Gratis, ditenagai Cloudflare Workers AI (FLUX).</p>
      </div>
      <div className="panel result-panel">
        {error && <div className="error-banner">{error}</div>}
        {!images.length && !loading && !error && <EmptyState icon={<ImageIcon size={28} />} text="Gambar akan muncul di sini." />}
        {loading && <SkeletonLines />}
        {images.map((img, i) => (
          <DraftCard key={i} title="Gambar dibuat" text={img.description}>
            {img.url && <img src={img.url} alt={prompt} className="generated-image" />}
            <p className="prose visual-desc">{img.description}</p>
          </DraftCard>
        ))}
      </div>
    </div>
  );
}

function LayoutTemplates() {
  const templates = [
    { name: "Tips (Carousel)", ratio: "1:1", accent: "#D6622A" },
    { name: "Promo Diskon", ratio: "4:5", accent: "#3D4A3D" },
    { name: "Kutipan Inspiratif", ratio: "1:1", accent: "#D6622A" },
    { name: "Story Highlight", ratio: "9:16", accent: "#3D4A3D" },
  ];
  return (
    <div className="template-grid">
      {templates.map((t, i) => (
        <div className="template-card" key={i}>
          <div className="template-preview" style={{ aspectRatio: t.ratio.replace(":", "/"), borderColor: t.accent }}>
            <LayoutTemplate size={26} style={{ color: t.accent }} />
            <span className="template-ratio">{t.ratio}</span>
          </div>
          <span className="template-name">{t.name}</span>
        </div>
      ))}
      <div className="template-card template-card-info">
        <p>Template kerangka siap pakai. Hubungkan ke Canva/Figma untuk mengisi dengan brand kit kamu.</p>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { PenLine, FileText } from "lucide-react";
import { callGemini, friendlyError } from "../lib/geminiClient";
import { NATURAL_SYSTEM } from "../lib/prompts";
import { ModuleHeader, PrimaryButton, EmptyState, DraftCard, SkeletonLines } from "../components/Shared";

export default function ContentWriter() {
  const [platform, setPlatform] = useState("blog");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("santai-profesional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const platforms = [
    { id: "blog", label: "Artikel Blog" },
    { id: "instagram", label: "Caption Instagram" },
    { id: "tiktok", label: "Skrip TikTok" },
  ];
  const tones = [
    { id: "santai-profesional", label: "Santai & profesional" },
    { id: "formal", label: "Formal" },
    { id: "playful", label: "Playful / lucu" },
    { id: "persuasif", label: "Persuasif" },
  ];

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const lengthHint =
        platform === "blog"
          ? "600-900 kata, dengan 3-4 subjudul H2 yang menarik"
          : platform === "instagram"
          ? "100-180 kata, hook kuat di kalimat pertama, 6-8 hashtag di akhir"
          : "skrip 30-45 detik, dibagi per scene dengan voice over dan visual cue";
      const prompt = `${NATURAL_SYSTEM}

Tulis ${platform === "blog" ? "artikel blog" : platform === "instagram" ? "caption Instagram" : "skrip video TikTok"} dalam Bahasa Indonesia.
Topik/brief: "${topic}"
Nada bahasa: ${tone}
Format: ${lengthHint}

Tulis langsung kontennya, tanpa kalimat pembuka seperti "Berikut adalah...". Jika blog, tulis judul di baris pertama diawali tanda #.`;
      const text = await callGemini(prompt);
      setResult(text);
    } catch (e) {
      setError(friendlyError(e, "Gagal membuat konten. Coba lagi sebentar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="module">
      <ModuleHeader icon={<PenLine size={20} />} title="Tulis Konten" desc="Buat artikel blog, caption sosmed, atau skrip video dengan gaya penulis profesional." />
      <div className="work-grid">
        <div className="panel">
          <label className="field-label">Platform</label>
          <div className="pill-row">
            {platforms.map((p) => (
              <button key={p.id} className={`pill ${platform === p.id ? "pill-active" : ""}`} onClick={() => setPlatform(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="field-label">Topik atau brief</label>
          <textarea
            className="textarea"
            placeholder="Contoh: 5 tips merawat tanaman hias untuk pemula yang sering lupa menyiram"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
          />
          <label className="field-label">Nada bahasa</label>
          <select className="select" value={tone} onChange={(e) => setTone(e.target.value)}>
            {tones.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <PrimaryButton onClick={generate} loading={loading} disabled={!topic.trim()}>
            Buat draf
          </PrimaryButton>
        </div>
        <div className="panel result-panel">
          {error && <div className="error-banner">{error}</div>}
          {!result && !loading && !error && <EmptyState icon={<FileText size={28} />} text="Draf konten akan muncul di sini." />}
          {loading && <SkeletonLines />}
          {result && (
            <DraftCard title="Draf konten" text={result}>
              <div className="prose">{result}</div>
            </DraftCard>
          )}
        </div>
      </div>
    </div>
  );
}

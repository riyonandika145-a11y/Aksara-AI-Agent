import React, { useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { callGemini, friendlyError } from "../lib/geminiClient";
import { ModuleHeader, PrimaryButton, EmptyState, DraftCard, SkeletonLines, CopyButton } from "../components/Shared";

export default function SeoAssistant() {
  const [mode, setMode] = useState("keyword");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const modes = [
    { id: "keyword", label: "Riset Kata Kunci" },
    { id: "meta", label: "Judul & Meta" },
    { id: "score", label: "Cek Skor SEO" },
  ];

  async function generate() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let prompt = "";
      if (mode === "keyword") {
        prompt = `Kamu pakar SEO Indonesia. Untuk topik: "${input}", buat riset kata kunci.
Balas HANYA JSON: {"keywords":[{"keyword":"...","intent":"informational/transactional/navigational","difficulty":"rendah/sedang/tinggi","alasan":"..."}]}
Berikan 8 kata kunci relevan.`;
      } else if (mode === "meta") {
        prompt = `Kamu pakar SEO Indonesia. Untuk topik: "${input}":
Balas HANYA JSON: {"judul":["3 judul SEO-friendly maks 60 karakter"],"meta_description":["2 meta description 140-156 karakter"]}`;
      } else {
        prompt = `Kamu pakar SEO Indonesia. Analisis artikel ini dari sisi SEO:
"""${input}"""
Balas HANYA JSON: {"skor":(0-100),"kekuatan":["poin1","poin2"],"perbaikan":["poin1","poin2","poin3"]}`;
      }
      const data = await callGemini(prompt, { json: true });
      setResult(data);
    } catch (e) {
      setError(friendlyError(e, "Gagal menganalisis. Coba lagi."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="module">
      <ModuleHeader icon={<Search size={20} />} title="SEO Assistant" desc="Riset kata kunci, optimasi judul & meta description, atau cek skor SEO artikel." />
      <div className="work-grid">
        <div className="panel">
          <label className="field-label">Mode</label>
          <div className="pill-row">
            {modes.map((m) => (
              <button
                key={m.id}
                className={`pill ${mode === m.id ? "pill-active" : ""}`}
                onClick={() => {
                  setMode(m.id);
                  setResult(null);
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <label className="field-label">{mode === "score" ? "Tempel teks artikel" : "Topik atau niche"}</label>
          <textarea
            className="textarea"
            placeholder={mode === "score" ? "Tempel isi artikel kamu di sini…" : "Contoh: kedai kopi rumahan untuk pemula"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={mode === "score" ? 8 : 4}
          />
          <PrimaryButton onClick={generate} loading={loading} disabled={!input.trim()}>
            Analisis
          </PrimaryButton>
        </div>
        <div className="panel result-panel">
          {error && <div className="error-banner">{error}</div>}
          {!result && !loading && !error && <EmptyState icon={<TrendingUp size={28} />} text="Hasil analisis SEO akan muncul di sini." />}
          {loading && <SkeletonLines />}
          {result && mode === "keyword" && (
            <div className="kw-list">
              {result.keywords?.map((k, i) => (
                <div className="kw-row" key={i}>
                  <div className="kw-main">
                    <span className="kw-term">{k.keyword}</span>
                    <span className={`badge badge-${k.difficulty === "rendah" ? "low" : k.difficulty === "tinggi" ? "high" : "mid"}`}>
                      {k.difficulty}
                    </span>
                  </div>
                  <div className="kw-meta">
                    {k.intent} — {k.alasan}
                  </div>
                </div>
              ))}
            </div>
          )}
          {result && mode === "meta" && (
            <>
              <DraftCard title="Pilihan judul SEO">
                <ol className="numbered-list">
                  {result.judul?.map((j, i) => (
                    <li key={i}>
                      <span>{j}</span>
                      <CopyButton text={j} />
                    </li>
                  ))}
                </ol>
              </DraftCard>
              <DraftCard title="Meta description">
                <ol className="numbered-list">
                  {result.meta_description?.map((m, i) => (
                    <li key={i}>
                      <span>{m}</span>
                      <CopyButton text={m} />
                    </li>
                  ))}
                </ol>
              </DraftCard>
            </>
          )}
          {result && mode === "score" && (
            <DraftCard title="Hasil analisis">
              <div className="score-display">
                <div className="score-circle">{result.skor}</div>
                <span className="score-label">dari 100</span>
              </div>
              <div className="score-cols">
                <div>
                  <h4>Kekuatan</h4>
                  <ul>
                    {result.kekuatan?.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Perlu diperbaiki</h4>
                  <ul>
                    {result.perbaikan?.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </DraftCard>
          )}
        </div>
      </div>
    </div>
  );
}

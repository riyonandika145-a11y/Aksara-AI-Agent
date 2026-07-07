import React, { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { callGemini, friendlyError } from "../lib/geminiClient";
import { ModuleHeader, PrimaryButton, EmptyState, DraftCard, SkeletonLines, CopyButton } from "../components/Shared";

export default function Copywriting() {
  const [type, setType] = useState("headline");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const types = [
    { id: "headline", label: "Headline & CTA" },
    { id: "ads", label: "Copy Iklan" },
    { id: "email", label: "Email Marketing" },
  ];

  async function generate() {
    if (!product.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let prompt = "";
      const audienceCtx = audience ? `Target audiens: ${audience}.` : "";
      if (type === "headline") {
        prompt = `Kamu copywriter senior Indonesia. Buat headline dan CTA untuk: "${product}". ${audienceCtx}
Gunakan teknik copywriting profesional: AIDA, curiosity gap, social proof, fear of missing out — tapi tetap terasa natural dan manusiawi, bukan clickbait murahan.
Balas HANYA JSON: {"headline":["5 headline kuat"],"cta":["5 teks CTA pendek dan kuat"]}`;
      } else if (type === "ads") {
        prompt = `Kamu copywriter iklan senior Indonesia. Buat 3 variasi copy iklan Meta/Instagram untuk: "${product}". ${audienceCtx}
Setiap variasi harus punya angle berbeda (mis: manfaat utama, pain point, social proof). Gunakan bahasa yang mengalir natural, tidak kaku.
Balas HANYA JSON: {"variasi":[{"headline":"...","body":"2-4 kalimat copy yang kuat dan natural"}]}`;
      } else {
        prompt = `Kamu email marketing specialist Indonesia. Tulis 1 email marketing untuk: "${product}". ${audienceCtx}
Gunakan struktur: hook pembuka yang kuat, nilai yang jelas, CTA yang tidak memaksa. Bahasa hangat dan personal.
Balas HANYA JSON: {"subject":"...","preview":"...","isi":"teks email lengkap"}`;
      }
      const data = await callGemini(prompt, { json: true });
      setResult(data);
    } catch (e) {
      setError(friendlyError(e, "Gagal membuat copy. Coba lagi sebentar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="module">
      <ModuleHeader icon={<Megaphone size={20} />} title="Copywriting" desc="Headline, CTA, copy iklan, dan email marketing yang natural dan menjual." />
      <div className="work-grid">
        <div className="panel">
          <label className="field-label">Jenis copy</label>
          <div className="pill-row">
            {types.map((t) => (
              <button
                key={t.id}
                className={`pill ${type === t.id ? "pill-active" : ""}`}
                onClick={() => {
                  setType(t.id);
                  setResult(null);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="field-label">Produk / jasa</label>
          <textarea
            className="textarea"
            placeholder="Contoh: kelas online belajar bahasa Inggris untuk profesional"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            rows={3}
          />
          <label className="field-label">Target audiens (opsional)</label>
          <input className="input" placeholder="Contoh: karyawan muda 22-30 tahun" value={audience} onChange={(e) => setAudience(e.target.value)} />
          <PrimaryButton onClick={generate} loading={loading} disabled={!product.trim()}>
            Buat copy
          </PrimaryButton>
        </div>
        <div className="panel result-panel">
          {error && <div className="error-banner">{error}</div>}
          {!result && !loading && !error && <EmptyState icon={<Send size={28} />} text="Hasil copywriting akan muncul di sini." />}
          {loading && <SkeletonLines />}
          {result && type === "headline" && (
            <>
              <DraftCard title="Headline">
                <ol className="numbered-list">
                  {result.headline?.map((h, i) => (
                    <li key={i}>
                      <span>{h}</span>
                      <CopyButton text={h} />
                    </li>
                  ))}
                </ol>
              </DraftCard>
              <DraftCard title="Call-to-action">
                <ol className="numbered-list">
                  {result.cta?.map((c, i) => (
                    <li key={i}>
                      <span>{c}</span>
                      <CopyButton text={c} />
                    </li>
                  ))}
                </ol>
              </DraftCard>
            </>
          )}
          {result &&
            type === "ads" &&
            result.variasi?.map((v, i) => (
              <DraftCard key={i} title={`Variasi ${i + 1}`} text={`${v.headline}\n${v.body}`}>
                <p className="ad-headline">{v.headline}</p>
                <p>{v.body}</p>
              </DraftCard>
            ))}
          {result && type === "email" && (
            <DraftCard title="Email marketing" text={`Subject: ${result.subject}\n\n${result.isi}`}>
              <p>
                <strong>Subject:</strong> {result.subject}
              </p>
              <p>
                <strong>Preview:</strong> {result.preview}
              </p>
              <hr className="divider" />
              <div className="prose">{result.isi}</div>
            </DraftCard>
          )}
        </div>
      </div>
    </div>
  );
}

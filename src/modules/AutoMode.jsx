import React, { useState } from "react";
import { Zap } from "lucide-react";
import { callGemini, friendlyError } from "../lib/geminiClient";
import { NATURAL_SYSTEM } from "../lib/prompts";
import { ModuleHeader, PrimaryButton, ProgressStep, EmptyState, DraftCard, SkeletonLines, CopyButton } from "../components/Shared";

// ── Mode AUTO: satu topik → semua modul sekaligus ────────────────────────────
export default function AutoMode() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("blog");
  const [tone, setTone] = useState("santai-profesional");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState({ artikel: null, seo: null, copy: null, desain: null });
  const [activeStep, setActiveStep] = useState(null);
  const [error, setError] = useState("");

  const platforms = [
    { id: "blog", label: "Blog" },
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
  ];
  const tones = [
    { id: "santai-profesional", label: "Santai & profesional" },
    { id: "formal", label: "Formal" },
    { id: "playful", label: "Playful" },
    { id: "persuasif", label: "Persuasif" },
  ];

  async function generateAll() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setSteps({ artikel: null, seo: null, copy: null, desain: null });

    try {
      // STEP 1 — Artikel
      setActiveStep("artikel");
      const lengthHint =
        platform === "blog"
          ? "600-900 kata, dengan 3-4 subjudul H2"
          : platform === "instagram"
          ? "100-180 kata + 6-8 hashtag relevan"
          : "skrip 30-45 detik, dibagi per scene";
      const artikelPrompt = `${NATURAL_SYSTEM}

Tulis konten ${platform === "blog" ? "artikel blog" : platform === "instagram" ? "caption Instagram" : "skrip video TikTok"} dalam Bahasa Indonesia.
Topik: "${topic}"
Nada: ${tone}
Format: ${lengthHint}

Tulis langsung kontennya. Jika blog, awali judul dengan tanda #.`;
      const artikel = await callGemini(artikelPrompt);
      setSteps((s) => ({ ...s, artikel }));

      // STEP 2 — SEO
      setActiveStep("seo");
      const seoPrompt = `Kamu adalah pakar SEO Indonesia.
Untuk topik: "${topic}", buat riset SEO dalam Bahasa Indonesia.
Balas HANYA JSON valid:
{"judul":[3 judul SEO-friendly, maks 60 karakter],"meta_description":[2 meta description 140-156 karakter],"keywords":[{"keyword":"...","intent":"informational/transactional","difficulty":"rendah/sedang/tinggi"}]}
Berikan 6 kata kunci.`;
      const seo = await callGemini(seoPrompt, { json: true });
      setSteps((s) => ({ ...s, seo }));

      // STEP 3 — Copywriting
      setActiveStep("copy");
      const copyPrompt = `Kamu adalah copywriter senior Indonesia berpengalaman.
Buat copy pemasaran untuk topik/produk: "${topic}" dalam Bahasa Indonesia.
Balas HANYA JSON valid:
{"headline":["5 headline kuat dan menarik"],"cta":["5 teks call-to-action pendek"],"ads":[{"headline":"...","body":"2-3 kalimat copy iklan yang persuasif dan natural"}]}
Buat 3 variasi iklan.`;
      const copy = await callGemini(copyPrompt, { json: true });
      setSteps((s) => ({ ...s, copy }));

      // STEP 4 — Desain
      setActiveStep("desain");
      const desainPrompt = `Kamu adalah creative director konten digital Indonesia.
Untuk topik: "${topic}", buat 3 konsep visual konten dalam Bahasa Indonesia.
Balas HANYA JSON valid:
{"konsep":[{"judul_konsep":"...","deskripsi_visual":"komposisi, palet warna, mood visual","caption":"caption Instagram lengkap dengan hashtag"}]}`;
      const desain = await callGemini(desainPrompt, { json: true });
      setSteps((s) => ({ ...s, desain }));
    } catch (e) {
      setError(friendlyError(e, "Terjadi error. Coba lagi sebentar."));
    } finally {
      setLoading(false);
      setActiveStep(null);
    }
  }

  const stepList = [
    { key: "artikel", label: "Tulis Konten" },
    { key: "seo", label: "SEO" },
    { key: "copy", label: "Copywriting" },
    { key: "desain", label: "Desain Konten" },
  ];
  const anyResult = Object.values(steps).some(Boolean);

  return (
    <div className="module">
      <ModuleHeader
        icon={<Zap size={20} />}
        title="Mode Auto"
        desc="Isi satu topik, semua modul (konten, SEO, copywriting, desain) generate sekaligus otomatis."
      />
      <div className="auto-layout">
        <div className="panel auto-input">
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
            placeholder="Contoh: 5 cara merawat tanaman hias untuk pemula yang sibuk"
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
          <PrimaryButton onClick={generateAll} loading={loading} disabled={!topic.trim()} variant="auto">
            Generate semua sekaligus
          </PrimaryButton>

          {loading && (
            <div className="progress-track">
              {stepList.map((s) => (
                <ProgressStep key={s.key} label={s.label} done={Boolean(steps[s.key])} active={activeStep === s.key} />
              ))}
            </div>
          )}
          {error && (
            <div className="error-banner" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
        </div>

        <div className="auto-results">
          {!anyResult && !loading && (
            <EmptyState icon={<Zap size={32} />} text="Isi topik lalu klik 'Generate semua' — keempat modul akan muncul di sini sekaligus." />
          )}

          {/* Artikel */}
          {(steps.artikel || (loading && activeStep === "artikel")) && (
            <DraftCard title="📝 Konten" text={steps.artikel || ""} collapsible>
              {steps.artikel ? <div className="prose">{steps.artikel}</div> : <SkeletonLines />}
            </DraftCard>
          )}

          {/* SEO */}
          {(steps.seo || (loading && (activeStep === "seo" || (activeStep !== "artikel" && !steps.seo)))) && (
            <DraftCard title="🔍 SEO" collapsible>
              {steps.seo ? (
                <>
                  <p className="section-label">Pilihan judul</p>
                  <ol className="numbered-list">
                    {steps.seo.judul?.map((j, i) => (
                      <li key={i}>
                        <span>{j}</span>
                        <CopyButton text={j} />
                      </li>
                    ))}
                  </ol>
                  <p className="section-label" style={{ marginTop: 12 }}>
                    Meta description
                  </p>
                  <ol className="numbered-list">
                    {steps.seo.meta_description?.map((m, i) => (
                      <li key={i}>
                        <span>{m}</span>
                        <CopyButton text={m} />
                      </li>
                    ))}
                  </ol>
                  <p className="section-label" style={{ marginTop: 12 }}>
                    Kata kunci
                  </p>
                  <div className="kw-list">
                    {steps.seo.keywords?.map((k, i) => (
                      <div className="kw-row" key={i}>
                        <div className="kw-main">
                          <span className="kw-term">{k.keyword}</span>
                          <span className={`badge badge-${k.difficulty === "rendah" ? "low" : k.difficulty === "tinggi" ? "high" : "mid"}`}>
                            {k.difficulty}
                          </span>
                        </div>
                        <div className="kw-meta">{k.intent}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <SkeletonLines />
              )}
            </DraftCard>
          )}

          {/* Copywriting */}
          {(steps.copy || (loading && steps.seo && !steps.copy)) && (
            <DraftCard title="📣 Copywriting" collapsible>
              {steps.copy ? (
                <>
                  <p className="section-label">Headline</p>
                  <ol className="numbered-list">
                    {steps.copy.headline?.map((h, i) => (
                      <li key={i}>
                        <span>{h}</span>
                        <CopyButton text={h} />
                      </li>
                    ))}
                  </ol>
                  <p className="section-label" style={{ marginTop: 12 }}>
                    Call-to-action
                  </p>
                  <ol className="numbered-list">
                    {steps.copy.cta?.map((c, i) => (
                      <li key={i}>
                        <span>{c}</span>
                        <CopyButton text={c} />
                      </li>
                    ))}
                  </ol>
                  <p className="section-label" style={{ marginTop: 12 }}>
                    Variasi iklan
                  </p>
                  {steps.copy.ads?.map((a, i) => (
                    <div key={i} className="ad-card">
                      <p className="ad-headline">{a.headline}</p>
                      <p>{a.body}</p>
                      <CopyButton text={`${a.headline}\n${a.body}`} />
                    </div>
                  ))}
                </>
              ) : (
                <SkeletonLines />
              )}
            </DraftCard>
          )}

          {/* Desain */}
          {(steps.desain || (loading && steps.copy && !steps.desain)) && (
            <DraftCard title="🎨 Desain Konten" collapsible>
              {steps.desain ? (
                steps.desain.konsep?.map((k, i) => (
                  <div key={i} className="konsep-card">
                    <p className="konsep-title">{k.judul_konsep}</p>
                    <p className="visual-desc">{k.deskripsi_visual}</p>
                    <hr className="divider" />
                    <p className="prose">{k.caption}</p>
                    <CopyButton text={k.caption} />
                  </div>
                ))
              ) : (
                <SkeletonLines />
              )}
            </DraftCard>
          )}
        </div>
      </div>
    </div>
  );
}

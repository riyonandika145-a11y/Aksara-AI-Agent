import React, { useState } from "react";
import { Copy, Check, Loader2, Sparkles, Zap, ChevronDown, ChevronUp } from "lucide-react";

export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="copy-btn"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Disalin" : "Salin"}
    </button>
  );
}

export function DraftCard({ title, children, text, collapsible = false }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="draft-card">
      <div className="draft-card-head">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {collapsible && (
            <button className="collapse-btn" onClick={() => setOpen(!open)}>
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <span className="draft-card-title">{title}</span>
        </div>
        {text && <CopyButton text={text} />}
      </div>
      {open && <div className="draft-card-body">{children}</div>}
    </div>
  );
}

export function PrimaryButton({ onClick, loading, children, disabled, variant = "default" }) {
  return (
    <button
      className={`primary-btn ${variant === "auto" ? "primary-btn-auto" : ""}`}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? <Loader2 size={16} className="spin" /> : variant === "auto" ? <Zap size={16} /> : <Sparkles size={16} />}
      {loading ? "Sedang menulis…" : children}
    </button>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div className="empty-state">
      {icon}
      <p>{text}</p>
    </div>
  );
}

export function SkeletonLines() {
  return (
    <div className="skeleton-wrap">
      <div className="skeleton-line w-90" />
      <div className="skeleton-line w-100" />
      <div className="skeleton-line w-70" />
      <div className="skeleton-line w-85" />
      <div className="skeleton-line w-95" />
      <div className="skeleton-line w-60" />
    </div>
  );
}

export function ProgressStep({ label, done, active }) {
  return (
    <div className={`progress-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
      <div className="progress-dot">{done ? <Check size={10} /> : active ? <Loader2 size={10} className="spin" /> : null}</div>
      <span>{label}</span>
    </div>
  );
}

export function ModuleHeader({ icon, title, desc }) {
  return (
    <div className="module-header">
      <div className="module-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
    </div>
  );
}

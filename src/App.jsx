import React, { useState } from "react";
import { PenLine, Search, Megaphone, Palette, Zap } from "lucide-react";
import "./styles.css";
import AutoMode from "./modules/AutoMode";
import ContentWriter from "./modules/ContentWriter";
import SeoAssistant from "./modules/SeoAssistant";
import Copywriting from "./modules/Copywriting";
import DesignContent from "./modules/DesignContent";

const NAV = [
  { id: "auto", label: "Mode Auto", icon: <Zap size={18} /> },
  { id: "write", label: "Tulis Konten", icon: <PenLine size={18} /> },
  { id: "seo", label: "SEO Assistant", icon: <Search size={18} /> },
  { id: "copy", label: "Copywriting", icon: <Megaphone size={18} /> },
  { id: "design", label: "Desain Konten", icon: <Palette size={18} /> },
];

export default function App() {
  const [active, setActive] = useState("auto");

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">Aksara</span>
          <span className="brand-sub">AI Content Agent</span>
        </div>
        <nav>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${active === n.id ? "nav-item-active" : ""} ${n.id === "auto" ? "nav-item-auto" : ""}`}
              onClick={() => setActive(n.id)}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">Ditenagai Google Gemini — 100% gratis</div>
      </aside>

      <main className="main-area">
        {active === "auto" && <AutoMode />}
        {active === "write" && <ContentWriter />}
        {active === "seo" && <SeoAssistant />}
        {active === "copy" && <Copywriting />}
        {active === "design" && <DesignContent />}
      </main>
    </div>
  );
}

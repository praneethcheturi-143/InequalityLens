import { useState, useEffect } from "react";
import ChoroplethMap from "./components/ChoroplethMap";
import LorenzPanel from "./components/LorenzPanel";
import MLPanel from "./components/MLPanel";
import TrendPanel from "./components/TrendPanel";
import USStatesPanel from "./components/USStatesPanel";
import SummaryBar from "./components/SummaryBar";
import AIChat from "./components/AIChat";
import ComparePanel from "./components/ComparePanel";
import PolicySimulator from "./components/PolicySimulator";
import "./App.css";

const TABS = [
  { id: "map",      label: "🌍 World Map" },
  { id: "lorenz",   label: "📈 Lorenz Curve" },
  { id: "trends",   label: "📉 Trends" },
  { id: "ml",       label: "🤖 ML Models" },
  { id: "us",       label: "🇺🇸 US States" },
  { id: "compare",  label: "⚡ Compare" },
  { id: "policy",   label: "🏛️ Policy Sim" },
  { id: "ai",       label: "💬 AI Analyst" },
];

export default function App() {
  const [tab, setTab] = useState("map");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚖️</span>
            <div>
              <h1>InequalityLens</h1>
              <p>Global inequality analytics dashboard</p>
            </div>
          </div>
          <div className="header-right">
            <nav className="tab-nav">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`tab-btn ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <button className="theme-toggle" onClick={() => setDark(d => !d)}>
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </header>

      <SummaryBar />

      <main className="main-content">
        {tab === "map"     && <ChoroplethMap />}
        {tab === "lorenz"  && <LorenzPanel />}
        {tab === "trends"  && <TrendPanel />}
        {tab === "ml"      && <MLPanel />}
        {tab === "us"      && <USStatesPanel />}
        {tab === "compare" && <ComparePanel />}
        {tab === "policy"  && <PolicySimulator />}
        {tab === "ai"      && <AIChat />}
      </main>

      <footer className="app-footer">
        <p>Data sources: World Bank · US Census ACS · WHO · Our World in Data</p>
      </footer>
    </div>
  );
}


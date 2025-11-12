// pages/index.js
import { useEffect, useState } from "react";

function ConfidencePill({ score }) {
  const pct = Number(score);
  let bg = "#9ca3af";
  if (pct >= 90) bg = "#10b981";
  else if (pct >= 75) bg = "#f59e0b";
  else if (pct >= 60) bg = "#f97316";
  else bg = "#6b7280";
  return (
    <span style={{
      display: "inline-block", padding: "6px 8px", borderRadius: 8, color: "white",
      background: bg, fontWeight: 700, minWidth: 56, textAlign: "center"
    }}>{pct}%</span>
  );
}

export default function Home() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetch("/api/user/status")
      .then(r => r.json())
      .then(j => setIsPro(!!j.isPro))
      .catch(() => {});
  }, []);

  function startProgress() {
    setProgress(6);
    const phases = [600, 900, 1200, 1600];
    let i = 0;
    const t = setInterval(() => {
      setProgress(p => {
        const next = Math.min(95, p + (3 + Math.random() * 10));
        if (next >= 95) {
          clearInterval(t);
          return next;
        }
        return next;
      });
      i++;
      if (i > 30) clearInterval(t);
    }, phases[i % phases.length]);
    return t;
  }

  async function handleSearch(e) {
    e?.preventDefault();
    if (!domain.trim()) return;
    setResults([]);
    setTotal(0);
    setLoading(true);
    setProgress(0);
    const timer = startProgress();

    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
        cache: "no-store"
      });
      setProgress(96);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API failed");
      setResults(isPro ? data.results : data.results.slice(0, 5));
      setTotal(data.total || data.results.length);
      setProgress(100);
      clearInterval(timer);
      setTimeout(()

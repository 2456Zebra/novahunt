// pages/index.js
import { useEffect, useState } from "react";

function ConfidencePill({ score }) {
  const pct = Number(score);
  let bg = "#9ca3af";
  if (pct >= 95) bg = "#10b981";
  else if (pct >= 85) bg = "#f59e0b";
  else if (pct >= 70) bg = "#f97316";
  return (
    <span style={{
      display: "inline-block", padding: "6px 10px", borderRadius: 8, color: "white",
      background: bg, fontWeight: 700, minWidth: 56, textAlign: "center", fontSize: 13
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
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user/status")
      .then(r => r.json())
      .then(j => setIsPro(!!j.isPro))
      .catch(() => {});
  }, []);

  function startProgress() {
    setProgress(6);
    const t = setInterval(() => {
      setProgress(p => {
        const next = Math.min(95, p + (3 + Math.random() * 10));
        if (next >= 95) clearInterval(t);
        return next;
      });
    }, 800);
    return t;
  }

  async function handleSearch(e) {
    e.preventDefault(); // NO REFRESH
    if (!domain.trim()) return;
    setError("");
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "API failed");
      setResults(isPro ? data.results : data.results.slice(0, 10));
      setTotal(data.total || data.results.length);
      setProgress(100);
      clearInterval(timer);
      setTimeout(() => setProgress(0), 500);
    } catch (err) {
      setError(err.message);
      setProgress(0);
      clearInterval(timer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <head>
        <link rel="icon" href="https://r.jina.ai/https://www.google.com/s2/favicons?domain=novahunt.ai&sz=64" />
      </head>

      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "16px 32px", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1e293b" }}>NovaHunt</h1>
          <div>
            {isPro ? (
              <span style={{ color: "#10b981", fontWeight: 600 }}>PRO</span>
            ) : (
              <a href="/upgrade" style={{ color: "#dc2626", fontWeight: 600, textDecoration: "underline" }}>Upgrade</a>
            )}
          </div>
        </header>

        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ width: "100%", maxWidth: 900, textAlign: "center" }}>
            <h2 style={{ fontSize: 32, margin: 0, fontWeight: 700, color: "#1e293b" }}>Find Business Emails</h2>
            <p style={{ color: "#64748b", marginTop: 8, fontSize: 18, marginBottom: 32 }}>
              Confidence scores <strong>85%–100%</strong>.
            </p>

            <form onSubmit={handleSearch} style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <input
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="e.g. fordmodels.com"
                style={{
                  padding: "14px 18px", fontSize: 16, width: 420, maxWidth: "100%",
                  borderRadius: 12, border: "1px solid #cbd5e1", outline: "none"
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "14px 32px", borderRadius: 12, background: loading ? "#93c5fd" : "#2563eb",
                  color: "white", fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Searching…" : "Search"}
              </button>
            </form>

            {error && (
              <p style={{ color: "#dc2626", marginTop: 16, fontWeight: 600 }}>{error}</p>
            )}

            {loading && (
              <div style={{ maxWidth: 600, margin: "24px auto 0" }}>
                <div style={{ height: 8, background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", background: "#2563eb", transition: "width 300ms ease" }} />
                </div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <p style={{ textAlign: "center", margin: "0 0 16px", color: "#475569" }}>
                  Showing <strong>{results.length}</strong> of <strong>{total}</strong> emails.
                  {!isPro && total > results.length && (
                    <a href="/upgrade" style={{ marginLeft: 8, color: "#dc2626", fontWeight: 600 }}>
                      Upgrade to reveal all {total}
                    </a>
                  )}
                </p>

                <div style={{ overflowX: "auto", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9" }}>
                        <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#334155" }}>Email</th>
                        <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#334155" }}>Name</th>
                        <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#334155" }}>Title</th>
                        <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#334155" }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={i} style={{ borderBottom: i === results.length - 1 ? "none" : "1px solid #e2e8f0" }}>
                          <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#1d4ed8" }}>{r.email}</td>
                          <td style={{ padding: "14px 16px", fontWeight: 500 }}>{r.first_name} {r.last_name}</td>
                          <td style={{ padding: "14px 16px", color: "#64748b" }}>{r.position}</td>
                          <td style={{ padding: "14px 16px" }}><ConfidencePill score={r.score} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// pages/index.js
import { useEffect, useState } from "react";
import UpgradeModal from "../components/UpgradeModal";

function ConfidencePill({ score }) {
  const pct = Number(score);
  let bg = "#ef4444";
  if (pct >= 90) bg = "#10b981";
  else if (pct >= 75) bg = "#f59e0b";
  else if (pct >= 60) bg = "#f97316";
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: 6,
      color: "white",
      background: bg,
      fontWeight: 700,
      fontSize: 12,
      minWidth: 44,
      textAlign: "center"
    }}>
      {pct}%
    </span>
  );
}

export default function Home() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/user/status")
      .then(r => r.json())
      .then(j => {
        setIsPro(!!j.isPro);
        setUser(j.email || null);
      })
      .catch(() => {});
  }, []);

  function startProgress() {
    setProgress(6);
    const t = setInterval(() => {
      setProgress(p => {
        const next = Math.min(95, p + (3 + Math.random() * 8));
        if (next >= 95) clearInterval(t);
        return next;
      });
    }, 800);
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
        body: JSON.stringify({ domain: domain.trim() })
      });
      setProgress(96);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(isPro ? data.results : data.results.slice(0, 5));
      setTotal(data.total);
      setProgress(100);
      clearInterval(timer);
      setTimeout(() => setProgress(0), 500);
    } catch (err) {
      alert("Search failed: " + err.message);
      setProgress(0);
      clearInterval(timer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "16px 32px", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1f2937" }}>NovaHunt</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <div style={{ fontSize: 14, color: "#374151" }}>
              <strong>{user}</strong> • <a href="/api/auth/logout" style={{ color: "#dc2626", textDecoration: "underline" }}>Logout</a>
            </div>
          ) : (
            <a href="/api/auth/login" style={{ fontSize: 14, color: "#2563eb", fontWeight: 600 }}>Login</a>
          )}
          {!isPro && !user && (
            <button onClick={() => setShowUpgrade(true)} style={{ padding: "6px 12px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, fontSize: 13 }}>
              Upgrade
            </button>
          )}
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 1000 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, margin: 0, fontWeight: 800, color: "#1f2937" }}>Find Business Emails</h2>
            <p style={{ color: "#6b7280", marginTop: 8, fontSize: 17 }}>
              Confidence scores <strong>85%–100%</strong>
            </p>
          </div>

          <form onSubmit={handleSearch} style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 32 }}>
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="coca-cola.com"
              style={{
                padding: "14px 18px",
                fontSize: 16,
                width: 380,
                maxWidth: "100%",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                background: loading ? "#93c5fd" : "#2563eb",
                color: "white",
                fontWeight: 700,
                border: "none",
                minWidth: 130,
                fontSize: 16
              }}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </form>

          {loading && (
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <div style={{ height: 8, background: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "#2563eb", transition: "width 300ms ease" }} />
              </div>
              <p style={{ textAlign: "center", marginTop: 8, color: "#6b7280", fontSize: 14 }}>
                {Math.round(progress)}%
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <p style={{ textAlign: "center", margin: "0 0 16px", color: "#374151", fontSize: 15 }}>
                Showing <strong>{results.length}</strong> of <strong>{total}</strong>
                {!isPro && total > results.length && (
                  <span onClick={() => setShowUpgrade(true)} style={{ marginLeft: 8, color: "#dc2626", cursor: "pointer", fontWeight: 600 }}>
                    Upgrade →
                  </span>
                )}
              </p>

              <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#374151" }}>Email</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#374151" }}>Name</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#374151" }}>Title</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#374151" }}>Score</th>
                      <th style={{ padding: "12px 16px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: i === results.length - 1 ? "none" : "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 14, color: "#1d4ed8" }}>{r.email}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 500 }}>{r.first_name} {r.last_name}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>{r.position}</td>
                        <td style={{ padding: "12px 16px" }}><ConfidencePill score={r.score} /></td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            onClick={async () => {
                              const v = await fetch("/api/verify", { method: "POST", body: JSON.stringify({ email: r.email }), headers: { "Content-Type": "application/json" } })
                                .then(r => r.json()).catch(() => ({ valid: false, score: 0 }));
                              alert(`${r.email}\n${v.valid ? "VALID" : "INVALID"} • ${v.score}%`);
                            }}
                            style={{
                              padding: "4px 8px",
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Check
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && results.length === 0 && (
            <p style={{ textAlign: "center", marginTop: 48, color: "#6b7280", fontSize: 17 }}>
              Enter a domain to start hunting.
            </p>
          )}

          {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
        </div>
      </main>
    </div>
  );
}

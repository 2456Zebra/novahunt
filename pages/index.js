// pages/index.js
import { useEffect, useState } from "react";
import UpgradeModal from "../components/UpgradeModal";

function ConfidencePill({ score }) {
  const pct = Number(score);
  let bg = "#9ca3af";
  if (pct >= 90) bg = "#10b981";
  else if (pct >= 75) bg = "#f59e0b";
  else if (pct >= 60) bg = "#f97316";
  else bg = "#6b7280";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 8px",
        borderRadius: 8,
        color: "white",
        background: bg,
        fontWeight: 700,
        minWidth: 56,
        textAlign: "center",
        fontSize: 14
      }}
    >
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
      setTimeout(() => setProgress(0), 500);
    } catch (err) {
      console.error("Search error:", err);
      alert("Search failed: " + (err.message || "unknown"));
      setProgress(0);
      clearInterval(timer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ width: "100%", maxWidth: 1000, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, margin: 0, fontWeight: 800, color: "#1f2937" }}>
            NovaHunt Emails
          </h1>
          <p style={{ color: "#6b7280", marginTop: 8, fontSize: 18 }}>
            Find business emails fast. Confidence scores <strong>85%–100%</strong>.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="Enter domain (e.g. coca-cola.com)"
            style={{
              padding: "14px 18px",
              fontSize: 16,
              width: 400,
              maxWidth: "100%",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.2s"
            }}
            onFocus={e => e.target.style.borderColor = "#2563eb"}
            onBlur={e => e.target.style.borderColor = "#d1d5db"}
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
              cursor: loading ? "not-allowed" : "pointer",
              minWidth: 140,
              fontSize: 16,
              boxShadow: "0 2px 6px rgba(37,99,235,0.3)"
            }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {loading && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div
              style={{
                height: 14,
                background: "#e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                  transition: "width 300ms ease"
                }}
              />
            </div>
            <p style={{ color: "#6b7280", marginTop: 12, textAlign: "center", fontSize: 15 }}>
              Scanning public pages and generating patterns… {Math.round(progress)}%
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <p style={{ textAlign: "center", margin: "0 0 24px", color: "#374151", fontSize: 16 }}>
              Showing <strong>{results.length}</strong> of <strong>{total}</strong> emails.
              {!isPro && total > results.length && (
                <span
                  onClick={() => setShowUpgrade(true)}
                  style={{
                    marginLeft: 10,
                    color: "#dc2626",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: 600
                  }}
                >
                  Upgrade to see all {total - results.length}
                </span>
              )}
            </p>

            <div style={{ overflowX: "auto", borderRadius: 16, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "white",
                  borderRadius: 16,
                  overflow: "hidden"
                }}
              >
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: "16px 18px", fontWeight: 600, color: "#1e293b", fontSize: 15 }}>Email</th>
                    <th style={{ padding: "16px 18px", fontWeight: 600, color: "#1e293b", fontSize: 15 }}>Name</th>
                    <th style={{ padding: "16px 18px", fontWeight: 600, color: "#1e293b", fontSize: 15 }}>Title</th>
                    <th style={{ padding: "16px 18px", fontWeight: 600, color: "#1e293b", fontSize: 15 }}>Score</th>
                    <th style={{ padding: "16px 18px", fontWeight: 600, color: "#1e293b", fontSize: 15 }}>Source</th>
                    <th style={{ padding: "16px 18px", fontWeight: 600, color: "#1e293b", fontSize: 15 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i === results.length - 1 ? "none" : "1px solid #e2e8f0",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                    >
                      <td style={{ padding: "16px 18px", fontFamily: "monospace", fontSize: 14.5, color: "#1e40af" }}>
                        {r.email}
                      </td>
                      <td style={{ padding: "16px 18px", fontWeight: 500 }}>
                        {r.first_name} {r.last_name}
                      </td>
                      <td style={{ padding: "16px 18px", color: "#475569" }}>{r.position}</td>
                      <td style={{ padding: "16px 18px" }}>
                        <ConfidencePill score={r.score} />
                      </td>
                      <td style={{ padding: "16px 18px", color: "#64748b", fontSize: 14 }}>
                        {r.source || "pattern"}
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <button
                          onClick={async () => {
                            try {
                              const v = await fetch("/api/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email: r.email })
                              }).then(res => res.json());
                              alert(`${r.email}\nStatus: ${v.valid ? "VALID" : "INVALID"}\nScore: ${v.score}%`);
                            } catch (err) {
                              alert(`Verification failed: ${err.message}`);
                            }
                          }}
                          style={{
                            padding: "9px 14px",
                            background: "#10b981",
                            color: "white",
                            borderRadius: 8,
                            fontSize: 13,
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                            boxShadow: "0 2px 4px rgba(16,185,129,0.3)"
                          }}
                        >
                          Verify
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
            Enter a domain and click <strong>Search</strong> to find emails.
          </p>
        )}

        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      </div>
    </div>
  );
}

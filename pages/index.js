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
        textAlign: "center"
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
    <div style={{ fontFamily: "Inter, Arial, sans-serif", padding: 28 }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>NovaHunt Emails</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Find business emails fast. Honest confidence scores (35–100%).
      </p>

      <form onSubmit={handleSearch} style={{ marginTop: 18 }}>
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="Enter domain (e.g. coca-cola.com)"
          style={{
            padding: 12,
            fontSize: 16,
            width: 360,
            maxWidth: "100%",
            borderRadius: 8,
            border: "1px solid #e5e7eb"
          }}
        />
        <button
          disabled={loading}
          style={{
            marginLeft: 10,
            padding: "10px 16px",
            borderRadius: 8,
            background: "#2563eb",
            color: "white",
            fontWeight: 700
          }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {loading && (
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              height: 12,
              background: "#e6e6e6",
              borderRadius: 8,
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#2563eb",
                transition: "width 300ms ease"
              }}
            />
          </div>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Searching public pages and generating pattern guesses… {Math.round(progress)}%
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <p style={{ margin: 0, color: "#374151" }}>
            Displaying <strong>{results.length}</strong> of <strong>{total}</strong> emails.
            {!isPro && total > results.length && (
              <span
                onClick={() => setShowUpgrade(true)}
                style={{
                  marginLeft: 10,
                  color: "#dc2626",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                Upgrade to see all {total - results.length} →
              </span>
            )}
          </p>

          <div style={{ marginTop: 12, maxWidth: 980 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 8
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "2px solid #e6e6e6"
                  }}
                >
                  <th style={{ padding: 12 }}>Email</th>
                  <th style={{ padding: 12 }}>Name</th>
                  <th style={{ padding: 12 }}>Title</th>
                  <th style={{ padding: 12 }}>Score</th>
                  <th style={{ padding: 12 }}>Source</th>
                  <th style={{ padding: 12 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                  >
                    <td style={{ padding: 12, fontFamily: "monospace" }}>
                      {r.email}
                    </td>
                    <td style={{ padding: 12 }}>
                      {r.first_name} {r.last_name}
                    </td>
                    <td style={{ padding: 12 }}>{r.position}</td>
                    <td style={{ padding: 12 }}>
                      <ConfidencePill score={r.score} />
                    </td>
                    <td style={{ padding: 12, color: "#6b7280" }}>
                      {r.source || "pattern"}
                    </td>
                    <td style={{ padding: 12 }}>
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
                          padding: "6px 10px",
                          background: "#10b981",
                          color: "white",
                          borderRadius: 6,
                          fontSize: 12,
                          border: "none",
                          cursor: "pointer"
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
        <p style={{ marginTop: 18, color: "#6b7280" }}>
          Enter a domain and click Search to find emails.
        </p>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}

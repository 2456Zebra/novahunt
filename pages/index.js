import { useEffect, useState } from "react";

function readProCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some(c => c.trim().startsWith("nova_pro="));
}

export default function Home() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setIsPro(readProCookie());
  }, []);

  async function safeFetchJson(url, opts) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || res.statusText || `HTTP ${res.status}`);
      }
      const txt = await res.text().catch(() => "");
      return txt ? JSON.parse(txt) : {};
    } catch (err) {
      throw err;
    }
  }

  async function doSearch(domain) {
    if (!domain) return;
    setError("");
    setLoading(true);
    setResults([]);
    setTotal(0);
    try {
      const payload = { domain };
      const data = await safeFetchJson("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const rows = data && data.results ? data.results : [];
      setResults(rows);
      setTotal(data.total || rows.length);
    } catch (err) {
      console.error("Search error", err);
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter") doSearch(q.trim());
  }

  // determine rows to display based on PRO
  const displayRows = isPro ? results : results.slice(0, 5);

  return (
    <div style={{
      fontFamily: "Inter, Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 40,
      minHeight: "100vh",
      background: "#f8fafc"
    }}>
      <header style={{ width: "100%", maxWidth: 900, textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 36, color: "#0f172a" }}>NovaHunt Emails</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Find business emails fast. Confidence scores 80–100%.
        </p>
        <div style={{ marginTop: 8 }}>
          <a href="/signin" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 600, fontSize: 14 }}>
            Sign In
          </a>
        </div>
      </header>

      <main style={{ width: "100%", maxWidth: 900, marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              placeholder="Search company domain (example: coca-cola.com)"
              style={{
                width: 360,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #e6edf3",
                background: "#fff"
              }}
            />
            <button
              onClick={() => doSearch(q.trim())}
              disabled={loading}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20, color: "#111827", display: "flex", justifyContent: "center" }}>
          <div style={{ textAlign: "center", width: "100%", maxWidth: 720 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
              <small style={{ color: "#6b7280" }}>
                {total > 0 ? `Showing ${Math.min(displayRows.length, total)} of ${total} emails.` : "Showing sample results."}
                {" "}&nbsp;
              </small>
              <a href="/signin?upgrade=1" style={{
                background: "#ef4444",
                color: "#fff",
                padding: "6px 10px",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 700
              }}>
                Upgrade
              </a>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
              {error && <div style={{ color: "#ef4444", marginBottom: 8 }}>{error}</div>}

              <div style={{ width: 420, margin: "0 auto", textAlign: "left" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "#6b7280", fontSize: 12, textTransform: "uppercase" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Email</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Name</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Title</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(displayRows.length === 0
                      ? [
                          { email: "info@coca-cola.com", first_name: "", last_name: "", position: "General", score: 65 },
                          { email: "contact@coca-cola.com", first_name: "", last_name: "", position: "General", score: 65 },
                          { email: "press@coca-cola.com", first_name: "", last_name: "", position: "General", score: 65 }
                        ]
                      : displayRows
                    ).map((r, i) => {
                      const backendScore = Number(r.score || 0);
                      const displayScore = Math.min(100, Math.max(80, backendScore));
                      const pct = `${displayScore}%`;
                      let color = "#f59e0b";
                      if (displayScore >= 95) color = "#16a34a";
                      else if (displayScore >= 90) color = "#22c55e";
                      else if (displayScore >= 85) color = "#84cc16";
                      return (
                        <tr key={i} style={{ borderTop: "1px solid #e6edf3" }}>
                          <td style={{ padding: "8px" }}>{r.email}</td>
                          <td style={{ padding: "8px" }}>{(r.first_name || "") + (r.last_name ? " " + r.last_name : "")}</td>
                          <td style={{ padding: "8px" }}>{r.position || "General"}</td>
                          <td style={{ padding: "8px" }}>
                            <span style={{ background: color, color: "#fff", padding: "6px 8px", borderRadius: 999 }}>{pct}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {!isPro && results.length > displayRows.length && (
                  <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
                    Upgrade to reveal all results.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";

export default function Home() {
  const [q, setQ] = useState("");
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
          Find business emails fast. Confidence scores 60–100%.
        </p>
        <div style={{ marginTop: 12 }}>
          <a href="/signin" style={{
            display: "inline-block",
            padding: "8px 14px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600
          }}>Sign In / Upgrade</a>
        </div>
      </header>

      <main style={{ width: "100%", maxWidth: 900, marginTop: 28 }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
        }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company domain (example: coca-cola.com)"
            style={{
              width: "100%",
              maxWidth: 640,
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid #e6edf3",
              background: "#fff"
            }}
          />
        </div>

        {/* Example results area — keep your current rendering logic or wire this to /api/emails */}
        <div style={{ marginTop: 20, color: "#111827" }}>
          <small style={{ color: "#6b7280" }}>Showing sample results. Upgrade to reveal full list →</small>
          {/* Keep your table/list rendering here */}
        </div>
      </main>
    </div>
  );
}

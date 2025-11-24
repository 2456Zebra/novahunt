// pages/index.js
import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [domain, setDomain] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!domain) return;
    router.push(`/search?domain=${encodeURIComponent(domain)}`);
  };

  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #e6e6e6", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="/" aria-label="NovaHunt home" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#111" }}>
            <span style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.2px" }}>NovaHunt</span>
          </a>
          <nav style={{ display: "flex", gap: "12px" }}>
            <a href="/" style={{ color: "#374151", textDecoration: "none" }}>Home</a>
            <a href="/plans" style={{ color: "#374151", textDecoration: "none" }}>Plans</a>
            <a href="/about" style={{ color: "#374151", textDecoration: "none" }}>About</a>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button style={{ background: "transparent", border: "1px solid #e5e7eb", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" }}>Sign in</button>
            <a href="/plans" style={{ padding: "6px 10px", borderRadius: "6px", background: "#111827", color: "#fff", textDecoration: "none" }}>Sign up</a>
          </div>
        </div>
      </header>

      <main style={{ padding: "24px" }}>
        <h1 style={{ marginTop: "20px" }}>Find business contacts from a domain</h1>
        <p style={{ color: "#6b7280" }}>Enter a company website (example: coca-cola.com) and NovaHunt will show public business contacts.</p>

        <form onSubmit={handleSearch} style={{ marginTop: "20px", display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter domain, e.g. coca-cola.com"
            style={{ flex: 1, padding: "10px" }}
          />
          <button type="submit" style={{ padding: "8px 12px" }}>Search</button>
        </form>
      </main>
    </div>
  );
}

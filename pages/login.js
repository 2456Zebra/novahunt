// pages/login.js
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pro, setPro] = useState(false);
  const [msg, setMsg] = useState("");

  async function handle(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pro })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Login failed");
      setMsg("Signed in — reloading...");
      setTimeout(() => window.location.href = "/", 800);
    } catch (err) {
      setMsg("Error: " + (err.message || "unknown"));
    }
  }

  return (
    <div style={{ fontFamily: "Inter, Arial", maxWidth: 640, margin: "80px auto", textAlign: "center" }}>
      <h1>Sign In / Mock PRO</h1>
      <p>Enter an email; check "Make me PRO" to simulate a PRO user (for testing).</p>
      <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ padding: 10, width: 340, borderRadius: 8, border: "1px solid #e5e7eb" }} required />
        <label style={{ fontSize: 14 }}>
          <input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} />{" "}
          Make me PRO (test)
        </label>
        <button type="submit" style={{ padding: "10px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 700 }}>
          Sign In
        </button>
        <div style={{ marginTop: 10, color: "#6b7280" }}>{msg}</div>
        <a href="/" style={{ marginTop: 8, color: "#2563eb" }}>← Back to search</a>
      </form>
    </div>
  );
}

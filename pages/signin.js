import { useEffect, useState } from "react";
import Router from "next/router";

function setProCookie() {
  // 30 days
  const maxAge = 30 * 24 * 60 * 60;
  // In local dev (http) cookies with Secure will not be set. Add Secure only on https.
  const secure = (typeof location !== "undefined" && location.protocol === "https:") ? "; Secure" : "";
  // Use SameSite=Lax and path=/ so front-end can read it
  document.cookie = `nova_pro=1; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export default function SignIn() {
  const [upgrading, setUpgrading] = useState(false);
  const [done, setDone] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "1") setShowUpgradeConfirm(true);
  }, []);

  async function confirmUpgrade() {
    setUpgrading(true);
    try {
      // Simulate checkout / processing
      await new Promise((r) => setTimeout(r, 900));
      setProCookie();
      setDone(true);
      // redirect back to home and include upgraded flag
      setTimeout(() => {
        Router.push("/?upgraded=1");
      }, 700);
    } catch (err) {
      console.error("upgrade failed", err);
      setUpgrading(false);
    }
  }

  return (
    <div style={{
      fontFamily: "Inter, Arial, sans-serif",
      maxWidth: 680,
      margin: "60px auto",
      textAlign: "center",
      padding: "0 16px"
    }}>
      <h1 style={{ fontSize: 28, marginBottom: 8, color: "#111827" }}>
        Sign In
      </h1>

      <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 15 }}>
        Authentication & upgrade flow — simulated for now.
      </p>

      <div style={{ marginBottom: 20 }}>
        <a href="/" style={{ color: "#2563eb", textDecoration: "underline" }}>← Back to NovaHunt</a>
      </div>

      {showUpgradeConfirm ? (
        <div style={{ marginTop: 6 }}>
          {done ? (
            <div style={{ color: "#16a34a", fontWeight: 700 }}>
              Upgrade successful — Redirecting...
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12, color: "#111827" }}>
                Confirm upgrade to reveal full results.
              </div>
              <button
                onClick={confirmUpgrade}
                disabled={upgrading}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {upgrading ? "Processing…" : "Confirm Upgrade — $9.99/month"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ color: "#6b7280" }}>
          Click the Upgrade link on the homepage to simulate a PRO upgrade.
        </div>
      )}
    </div>
  );
}

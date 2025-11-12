// components/UpgradeModal.js
import { useState } from "react";

export default function UpgradeModal({ onClose }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_1..." }) // Your Stripe Price ID
    });
    const { url } = await res.json();
    window.location = url;
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 400 }}>
        <h2>Go PRO — $9.99/mo</h2>
        <ul>
          <li>Unlimited emails</li>
          <li>Real-time verification</li>
          <li>Export CSV</li>
          <li>No limits</li>
        </ul>
        <button onClick={handleUpgrade} disabled={loading} style={{
          width: "100%", padding: 12, background: "#10b981", color: "white", borderRadius: 8, marginTop: 16
        }}>
          {loading ? "Redirecting..." : "Upgrade Now"}
        </button>
        <button onClick={onClose} style={{ marginTop: 8, color: "#6b7280" }}>Cancel</button>
      </div>
    </div>
  );
}

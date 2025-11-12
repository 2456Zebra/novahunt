// components/UpgradeModal.js
import { useState } from "react";

export default function UpgradeModal({ onClose }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // Replace with real Stripe checkout later
    alert("Stripe checkout coming soon!");
    setLoading(false);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{ background: "white", padding: 32, borderRadius: 12, maxWidth: 400, textAlign: "center" }}>
        <h2 style={{ marginTop: 0 }}>Go PRO — $9.99/mo</h2>
        <ul style={{ textAlign: "left", paddingLeft: 20 }}>
          <li>Unlimited emails</li>
          <li>Real-time verification</li>
          <li>Export to CSV</li>
          <li>No limits</li>
        </ul>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: "100%", padding: 12, background: "#10b981", color: "white", borderRadius: 8, marginTop: 16, border: "none"
          }}
        >
          {loading ? "Redirecting..." : "Upgrade Now"}
        </button>
        <button onClick={onClose} style={{ marginTop: 8, color: "#6b7280", background: "none", border: "none" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

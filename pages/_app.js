// pages/blocked.js
import React from "react";

export default function Blocked() {
  const goHome = () => {
    // Full URL of the good deployment
    window.location.href = "https://novahunt-dxf7v1h9v-nova-hunts-projects.vercel.app/";
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Access Blocked</h1>
      <p>You are not allowed to view this site.</p>
      <button
        onClick={goHome}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Go Home
      </button>
    </div>
  );
}

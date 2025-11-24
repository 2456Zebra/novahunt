import React from "react";

export default function Blocked() {
  const goHome = () => {
    // Always go to the good deployment URL
    window.location.href = "https://novahunt-dxf7v1h9v-nova-hunts-projects.vercel.app/";
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f5f5f5",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      padding: "20px"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "20px", color: "#333" }}>
        Access Blocked
      </h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "30px", color: "#666" }}>
        You are not allowed to view this site.
      </p>
      <button
        onClick={goHome}
        style={{
          padding: "12px 24px",
          fontSize: "1rem",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#0057FF",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        Go Home
      </button>
    </div>
  );
}

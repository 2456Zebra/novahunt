// pages/blocked.js
import React from "react";
import Link from "next/link";

export default function Blocked() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#f8f9fa",
        color: "#333",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚫 Access Blocked</h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
        This deployment is not approved for viewing.
      </p>
      <Link
        href="/"
        style={{
          textDecoration: "none",
          backgroundColor: "#0070f3",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: "6px",
          fontWeight: "bold",
        }}
      >
        Go to Home
      </Link>
    </div>
  );
}

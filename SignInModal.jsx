'use client';

import React, { useState } from "react";

/**
 * Lightweight client-only SignIn modal (NO firebase imports).
 * This is a safe placeholder so builds succeed. Replace later with real Firebase logic.
 */
export default function SignInModal({ open, onClose }) {
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Placeholder behaviour: don't try to call external auth here.
    // Replace with real auth when you're ready.
    if (mode === "signin") {
      setMessage("Demo sign-in: feature disabled in this build. You will be redirected.");
      setTimeout(() => {
        setMessage("");
        onClose();
      }, 1200);
    } else if (mode === "signup") {
      setMessage("Demo sign-up: account creation disabled in this build.");
      setTimeout(() => {
        setMessage("");
        onClose();
      }, 1400);
    } else if (mode === "forgot") {
      setMessage("Demo reset: please check your real app flow.");
      setTimeout(() => {
        setMessage("");
        setMode("signin");
      }, 1200);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "90%", maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "none", border: "none", fontSize: "1.25rem" }}>×</button>
        <h2 style={{ marginTop: 0 }}>{mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}</h2>

        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "0.75rem", border: "1px solid #ccc", borderRadius: "8px" }} />
          {mode !== "forgot" && <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: "0.75rem", border: "1px solid #ccc", borderRadius: "8px" }} />}
          <button type="submit" style={{ background: "#111827", color: "white", padding: "0.75rem", borderRadius: "8px", border: "none" }}>
            {mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Send Reset Link"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
          {mode === "signin" && (
            <>
              Forgot password? <a href="#" onClick={() => setMode("forgot")} style={{ color: "#007bff" }}>Reset</a> • <a href="#" onClick={() => setMode("signup")} style={{ color: "#007bff" }}>Sign Up</a>
            </>
          )}
          {mode === "signup" && <a href="#" onClick={() => setMode("signin")} style={{ color: "#007bff" }}>Have an account? Sign in</a>}
          {mode === "forgot" && <a href="#" onClick={() => setMode("signin")} style={{ color: "#007bff" }}>Back to sign in</a>}
        </div>
      </div>
    </div>
  );
}

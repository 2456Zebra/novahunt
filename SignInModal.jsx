import React, { useState } from "react";

export default function SignInModal({ open, onClose }) {
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signin") {
      alert(`Sign In: ${email}`);
    } else if (mode === "signup") {
      alert(`Sign Up: ${email}`);
    } else if (mode === "forgot") {
      alert(`Password reset link sent to ${email}`);
      setMode("signin");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "400px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <h2>{mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "0.75rem", border: "1px solid #ccc", borderRadius: "8px" }}
          />
          {mode !== "forgot" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: "0.75rem", border: "1px solid #ccc", borderRadius: "8px" }}
            />
          )}
          <button
            type="submit"
            style={{
              background: "#007bff",
              color: "white",
              padding: "0.75rem",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Send Reset Link"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
          {mode === "signin" && (
            <>
              <a href="#" onClick={() => setMode("forgot")} style={{ color: "#007bff" }}>
                Forgot password?
              </a>{" "}
              •{" "}
              <a href="#" onClick={() => setMode("signup")} style={{ color: "#007bff" }}>
                Create account
              </a>
            </>
          )}
          {mode === "signup" && (
            <a href="#" onClick={() => setMode("signin")} style={{ color: "#007bff" }}>
              Already have an account? Sign in
            </a>
          )}
          {mode === "forgot" && (
            <a href="#" onClick={() => setMode("signin")} style={{ color: "#007bff" }}>
              Back to sign in
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
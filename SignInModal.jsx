import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase-config";

export default function SignInModal({ open, onClose }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("Signed in! Redirecting...");
        setTimeout(onClose, 1500);
      } else if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage("Account created! Check your email for verification.");
        setTimeout(onClose, 2000);
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email sent!");
        setTimeout(() => setMode("signin"), 2000);
      }
    } catch (err) {
      setError(err.message.includes("wrong-password") ? "Incorrect password." : err.message);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: "white", padding: "2rem", borderRadius: "12px", width: "90%", maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "none", border: "none", fontSize: "1.5rem" }}>×</button>
        <h2>{mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "0.75rem", border: "1px solid #ccc", borderRadius: "8px" }} />
          {mode !== "forgot" && (
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: "0.75rem", border: "1px solid #ccc", borderRadius: "8px" }} />
          )}
          <button type="submit" style={{ background: "#007bff", color: "white", padding: "0.75rem", border: "none", borderRadius: "8px" }}>
            {mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Send Reset Link"}
          </button>
        </form>
        <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
          {mode === "signin" && (
            <>Forgot password? <a href="#" onClick={() => setMode("forgot")} style={{ color: "#007bff" }}>Reset</a> • <a href="#" onClick={() => setMode("signup")} style={{ color: "#007bff" }}>Sign Up</a></>
          )}
          {mode === "signup" && <a href="#" onClick={() => setMode("signin")} style={{ color: "#007bff" }}>Have account? Sign in</a>}
          {mode === "forgot" && <a href="#" onClick={() => setMode("signin")} style={{ color: "#007bff" }}>Back to sign in</a>}
        </div>
      </div>
    </div>
  );
}
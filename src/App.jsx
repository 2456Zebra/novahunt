import React, { useState } from "react";
import SignInModal from "./components/SignInModal";

function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", color: "#1a1a1a" }}>NovaHunt</h1>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: "#007bff",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
      </header>

      <section style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#1a1a1a" }}>
          AI-Powered Lead Generation That Hunts for You
        </h2>
        <p style={{ fontSize: "1.2rem", color: "#555", marginBottom: "2rem" }}>
          Redefine B2B success with cutting-edge AI precision.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ border: "1px solid #ddd", padding: "1.5rem", borderRadius: "12px", minWidth: "200px" }}>
            <h3>Pro</h3>
            <p style={{ fontSize: "1.5rem", margin: "0.5rem 0" }}><strong>$29</strong>/month</p>
          </div>
          <div style={{ border: "1px solid #ddd", padding: "1.5rem", borderRadius: "12px", minWidth: "200px" }}>
            <h3>Business</h3>
            <p style={{ fontSize: "1.5rem", margin: "0.5rem 0" }}><strong>$59</strong>/month</p>
          </div>
          <div style={{ border: "1px solid #ddd", padding: "1.5rem", borderRadius: "12px", minWidth: "200px" }}>
            <h3>Enterprise</h3>
            <p style={{ fontSize: "1.5rem", margin: "0.5rem 0" }}><strong>$99</strong>/month</p>
          </div>
        </div>

        <p style={{ marginTop: "1.5rem", color: "#007bff", fontWeight: "bold" }}>
          Free credits • No credit card required
        </p>
      </section>

      <section style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Search for Leads</h2>
        <p style={{ color: "#555", marginBottom: "1.5rem" }}>
          Unleash NovaHunt’s power across multiple modes.
        </p>
        <input
          type="text"
          placeholder="Enter a company name or domain (e.g., coca-cola.com)"
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "1rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        />
        <br />
        <input
          type="text"
          placeholder="Ask me anything (e.g., 'Find marketing managers in tech USA')"
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "1rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      </section>

      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default App;

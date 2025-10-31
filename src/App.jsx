import React from "react";


function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header with Buttons */}
 <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
  <h1 style={{ margin: 0, fontSize: "2rem", color: "#1a1a1a" }}>NovaHunt</h1>
  <div style={{ display: "flex", gap: "1rem" }}>
    <button
      onClick={() => alert("Import Records - Coming soon!")}
      style={{
        background: "none",
        border: "1px solid #007bff",
        color: "#007bff",
        padding: "0.5rem 1rem",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Import Records
    </button>
    <button
      onClick={() => alert("Sign Up - Coming soon!")}
      style={{
        background: "#007bff",
        color: "white",
        border: "none",
        padding: "0.5rem 1rem",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Sign Up
    </button>
    <button
      onClick={() => alert("Sign In - Coming soon!")}
      style={{
        background: "#007bff",
        color: "white",
        border: "none",
        padding: "0.5rem 1rem",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      Sign In
    </button>
  </div>
</header>

      {/* Hero Section */}
      <section style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#1a1a1a" }}>
          AI-Powered Lead Generation That Hunts for You
        </h2>
        <p style={{ fontSize: "1.2rem", color: "#555", marginBottom: "2rem" }}>
          Redefine B2B success with cutting-edge AI precision.
        </p>

        {/* Pricing Cards */}
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

      {/* Search Section */}
     {/* Search Section */}
<section style={{ textAlign: "center" }}>
  <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Search for Leads</h2>
  <p style={{ color: "#555", marginBottom: "1.5rem" }}>
    Unleash NovaHunt's power across multiple modes.
  </p>

  {/* Mode Tabs */}
  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
    <button style={{ padding: "0.5rem 1rem", background: "#007bff", color: "white", border: "none", borderRadius: "8px" }}>
      Corporate Emails
    </button>
    <button style={{ padding: "0.5rem 1rem", background: "#007bff", color: "white", border: "none", borderRadius: "8px" }}>
      Industry Leads
    </button>
    <button style={{ padding: "0.5rem 1rem", background: "#007bff", color: "white", border: "none", borderRadius: "8px" }}>
      Import Records
    </button>
  </div>

  <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>
    <strong>Corporate Emails:</strong> Hunt for emails on company domains (e.g., coca-cola.com → john@cola.com).<br/>
    <strong>Industry Leads:</strong> Find targeted contacts by industry, role, location (e.g., "marketing managers in tech USA").<br/>
    <strong>Import Records:</strong> Upload your CSV and enrich with emails and data (coming soon).
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
      
    </div>
  );
}

export default App;

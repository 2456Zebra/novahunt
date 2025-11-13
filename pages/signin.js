export default function SignIn() {
  return (
    <div style={{
      fontFamily: "Inter, Arial, sans-serif",
      maxWidth: 600,
      margin: "100px auto",
      textAlign: "center",
      padding: "0 16px"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 16, color: "#111827" }}>
        Sign In / Upgrade
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 32, fontSize: 16 }}>
        Authentication system coming soon.
      </p>
      <a
        href="/"
        style={{
          color: "#2563eb",
          textDecoration: "underline",
          fontWeight: 600
        }}
      >
        ← Back to NovaHunt
      </a>
    </div>
  );
}

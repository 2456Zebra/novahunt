// pages/index.js
import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: "40px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "20px" }}>
        NovaHunt
      </h1>

      <p style={{ fontSize: "20px", marginBottom: "30px" }}>
        Find business emails instantly. Enter a company domain, and get professional email results.
      </p>

      <Link href="/search">
        <button style={{
          padding: "14px 26px",
          fontSize: "18px",
          cursor: "pointer",
          borderRadius: "8px",
          border: "1px solid #333",
          background: "#000",
          color: "#fff"
        }}>
          Start Searching
        </button>
      </Link>
    </main>
  );
}

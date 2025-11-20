export default function AboutPage() {
  return (
    <main style={{ maxWidth: 900, margin: '48px auto', padding: 24 }}>
      <h1>About NovaHunt</h1>

      <p style={{ color: '#374151' }}>
        NovaHunt helps teams discover and verify contact emails so they can reach the right people faster.
        We combine trusted data sources, thoughtful UX, and team-aware billing so prospecting is painless.
      </p>

      <h3 style={{ marginTop: 20 }}>Our mission</h3>
      <p style={{ color: '#374151' }}>
        We believe finding the right contact should be simple, fast, and reliable. Our mission is to remove
        the friction from outbound discovery so teams can focus on conversations, not data cleanup.
      </p>

      <h3 style={{ marginTop: 20 }}>What we do</h3>
      <ul style={{ color: '#374151' }}>
        <li>Domain-based email hunting and confidence scoring</li>
        <li>Per-contact reveals with usage tracking</li>
        <li>Team features: shared quotas, admin controls, and SSO</li>
      </ul>

      <h3 style={{ marginTop: 20 }}>Contact</h3>
      <p style={{ color: '#374151' }}>
        For issues or billing questions, email support@novahunt.ai (or use the in-app support button).
      </p>
    </main>
  );
}

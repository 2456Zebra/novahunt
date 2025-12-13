export default function Home() {
  return (
    <main style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 48 }}>NovaHunt.ai</h1>
      <p style={{ fontSize: 24 }}>Your AI-powered hunting tool</p>
      <div style={{ marginTop: 40 }}>
        <a href="/checkout" style={{ padding: 16, background: '#0066ff', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 18 }}>
          Sign Up & Get Started
        </a>
      </div>
    </main>
  );
}

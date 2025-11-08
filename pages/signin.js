// pages/signin.js
export default function SignIn() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form style={{ width: '300px', padding: '2rem', border: '1px solid #eee', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Sign In</h2>
        <input type="email" placeholder="Email" style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '6px' }} />
        <input type="password" placeholder="Password" style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '6px' }} />
        <button style={{ width: '100%', padding: '0.75rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
          Sign In
        </button>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
          <a href="/signup" style={{ color: '#0070f3' }}>Create account</a>
        </p>
      </form>
    </div>
  );
}

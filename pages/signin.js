// pages/signin.js
export default function SignIn() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#f9f9f9', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#111' }}>Sign In</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="email" placeholder="Email" required style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }} />
          <input type="password" placeholder="Password" required style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }} />
          <button type="submit" style={{ padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' }}>
            Sign In
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#666' }}>
          No account? <a href="/signup" style={{ color: '#2563eb', textDecoration: 'underline' }}>Sign up free</a>
        </p>
      </div>
    </div>
  );
}

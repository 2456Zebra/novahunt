import { useState } from 'react';

/*
Centered Sign-in page with "Back to Home" button.
- Fixes input overflow with box-sizing and width:100%.
- On success (demo flow) sets nh_user_email and nh_usage in localStorage and redirects to homepage.
- Replace the demo auth code with your real signin endpoint if needed.
*/
export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      // Replace this block with your real authentication call if you have one.
      // Example:
      // const res = await fetch('/api/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      // if (!res.ok) throw new Error('Sign-in failed');

      // Demo fallback: set local signed-in state
      try {
        localStorage.setItem('nh_user_email', email);
        const existing = localStorage.getItem('nh_usage');
        if (!existing) {
          localStorage.setItem('nh_usage', JSON.stringify({ searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3, plan: 'free' }));
        }
        localStorage.setItem('nh_usage_last_update', Date.now().toString());
      } catch (e) {
        // ignore storage errors
      }

      // Redirect to home/dashboard
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7f7f8',
      padding: 24,
      boxSizing: 'border-box'
    }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ marginBottom: 18, textAlign: 'center' }}>
          <h1 style={{ margin: 0 }}>Sign in</h1>
          <p style={{ marginTop: 8, color: '#666' }}>Access your NovaHunt account.</p>
        </div>

        <form onSubmit={onSubmit} style={{ background: '#fff', border: '1px solid #eee', padding: 24, borderRadius: 10, boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 8, borderRadius: 6, border: '1px solid #e6e6e6', boxSizing: 'border-box' }}
              required
            />
          </label>

          <label style={{ display: 'block', marginBottom: 12 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 8, borderRadius: 6, border: '1px solid #e6e6e6', boxSizing: 'border-box' }}
              required
            />
          </label>

          {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#0b74ff',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <a href="/signup" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: 8, border: '1px solid #e6e6e6', background: '#fff', color: '#333' }}>
              Create account
            </a>

            <a href="/" style={{ marginLeft: 'auto', padding: '10px 12px', borderRadius: 8, border: '1px solid #e6e6e6', background: '#fff', color: '#333', textDecoration: 'none' }}>
              Back to Home
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

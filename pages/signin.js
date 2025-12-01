import { useState } from 'react';

/*
Sign-in page (replacement)
- Fixes password input overflow by using box-sizing and width:100% inside the form container.
- Preserve a simple layout and behaviors; adapt the action to your real signin endpoint if needed.
- This file is standalone; paste to pages/signin.js to replace current file.
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
      // Replace with real auth call if you have one.
      // Example:
      // const res = await fetch('/api/signin', { method: 'POST', body: JSON.stringify({ email, password }) });
      // if (!res.ok) throw new Error('Sign-in failed');

      // Demo: set local signed-in state (for client-only fallback)
      try {
        localStorage.setItem('nh_user_email', email);
        // Keep existing nh_usage if present; otherwise initialize to free plan defaults
        const existing = localStorage.getItem('nh_usage');
        if (!existing) {
          localStorage.setItem('nh_usage', JSON.stringify({ searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3, plan: 'free' }));
        }
        localStorage.setItem('nh_usage_last_update', Date.now().toString());
      } catch (e) {}
      // Redirect to homepage
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Sign in</h1>

      <form onSubmit={onSubmit} style={{ background: '#fff', border: '1px solid #eee', padding: 20, borderRadius: 8, boxSizing: 'border-box' }}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6', boxSizing: 'border-box' }}
            required
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px 12px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6', boxSizing: 'border-box' }}
            required
          />
        </label>

        {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12 }}>
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
              cursor: 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <a href="/signup" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: 8, border: '1px solid #e6e6e6', background: '#fff', color: '#333' }}>
            Create account
          </a>
        </div>
      </form>
    </main>
  );
}

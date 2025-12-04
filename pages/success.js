import { useState } from 'react';

export default function SuccessPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function setPasswordDirect(e) {
    e.preventDefault();
    setStatus(null);
    if (!email || !password) {
      setStatus({ ok: false, message: 'Enter your email and a password.' });
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/set-password-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await r.json();
      if (r.ok) {
        setStatus({ ok: true, message: json.message || 'Password set. You can now sign in.' });
      } else {
        const msg = json.error || json.detail || JSON.stringify(json) || 'Failed to set password';
        setStatus({ ok: false, message: msg });
      }
    } catch (err) {
      setStatus({ ok: false, message: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: 20 }}>
      <h1>Payment successful</h1>

      <p>
        Thanks — your payment was successful. You need to set a password to sign in and access your account.
      </p>

      <hr style={{ margin: '20px 0' }} />

      <h3>Set your password</h3>
      <p>Enter the email you used during checkout and choose a password. We will verify the payment with Stripe and create your account.</p>

      <form onSubmit={setPasswordDirect} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={{ padding: 8 }} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a password" required style={{ padding: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={loading} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>
            {loading ? 'Setting…' : 'Submit'}
          </button>
        </div>
      </form>

      {status ? (
        <div style={{ marginTop: 12, color: status.ok ? 'green' : 'red' }}>
          {status.message}
        </div>
      ) : null}
    </div>
  );
}

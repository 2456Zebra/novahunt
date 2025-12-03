import { useState } from 'react';
import Link from 'next/link';

export default function SuccessPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function resend(e) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const r = await fetch('/api/send-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await r.json();
      if (r.ok) {
        setStatus({ ok: true, message: 'Set-password email sent. Check your inbox.' });
      } else {
        setStatus({ ok: false, message: json.error || 'Failed to send' });
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
      <p>Thanks — your payment was successful. If you already have an account, you can sign in. If you used a new email in checkout, you may need to set a password.</p>

      <div style={{ marginTop: 16 }}>
        <Link href="/signin"><a style={{ color: '#2563eb' }}>Sign in</a></Link>
      </div>

      <hr style={{ margin: '20px 0' }} />

      <h3>Didn't receive a Set Password email?</h3>
      <p>Enter the email you used for checkout and we'll resend the set-password/recovery email.</p>

      <form onSubmit={resend} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={{ padding: 8, flex: 1 }} />
        <button disabled={loading} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>
          {loading ? 'Sending…' : 'Resend email'}
        </button>
      </form>

      {status ? (
        <div style={{ marginTop: 12, color: status.ok ? 'green' : 'red' }}>
          {status.message}
        </div>
      ) : null}
    </div>
  );
}

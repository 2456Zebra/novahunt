import { useState } from 'react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const go = async (e) => {
    e.preventDefault();
    setLoading(true);
    const r = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const { url } = await r.json();
    window.location.href = url;
  };

  return (
    <form onSubmit={go}>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" />
      <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Sign Up & Pay'}</button>
    </form>
  );
}

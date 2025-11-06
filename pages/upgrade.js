// pages/upgrade.js
import React, { useState } from 'react';
import Nav from '../components/Nav';

export default function UpgradePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function startCheckout(e) {
    e.preventDefault();
    setMsg(null);
    if (!email) { setMsg({ type: 'error', text: 'Please enter your email to start checkout.' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          successUrl: window.location.origin + '/?success=1',
          cancelUrl: window.location.origin + '/?canceled=1'
        })
      });
      const bodyText = await res.text().catch(()=>null);
      let json = null;
      try { json = bodyText ? JSON.parse(bodyText) : null; } catch {}
      if (res.ok && json && json.url) {
        window.location.href = json.url;
      } else {
        const err = (json && json.error) ? json.error : (bodyText || res.statusText || `Error ${res.status}`);
        setMsg({ type: 'error', text: err });
      }
    } catch (err) {
      console.error('Checkout failed', err);
      setMsg({ type: 'error', text: 'Unable to start checkout. Check console.' });
    } finally { setLoading(false); }
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 760, margin: '32px auto', padding: 20 }}>
        <h1>Upgrade</h1>
        <p>Upgrade to the paid plan. Enter your email and start checkout.</p>
        <form onSubmit={startCheckout}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Email
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ display:'block', width:'100%', padding:8, marginTop:6 }} />
          </label>
          <button type="submit" disabled={loading} style={{ padding: '8px 14px' }}>{loading ? 'Starting...' : 'Start checkout'}</button>
        </form>

        {msg && <div style={{ marginTop: 16, color: msg.type === 'error' ? '#a00' : '#080' }}>{msg.text}</div>}
      </main>
    </div>
  );
}
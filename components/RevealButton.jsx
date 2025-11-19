// components/RevealButton.jsx
import { useState } from 'react';

export default function RevealButton({ contactId, payload, onRevealed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function doReveal() {
    setLoading(true);
    setError(null);
    try {
      const nh = typeof window !== 'undefined' ? localStorage.getItem('nh_session') || '' : '';
      if (!nh) {
        try { window.dispatchEvent(new CustomEvent('open-signin-modal')); } catch (e) {}
        setLoading(false);
        return;
      }

      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-nh-session': nh },
        body: JSON.stringify({ contactId, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Reveal failed');
      } else {
        onRevealed && onRevealed(json.revealed);
        try { window.dispatchEvent(new Event('account-usage-updated')); } catch (e) {}
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={doReveal} disabled={loading} style={{
        padding: '6px 8px',
        borderRadius: 6,
        border: '1px solid #ddd',
        background: loading ? '#f3f4f6' : '#fff',
        cursor: 'pointer'
      }}>
        {loading ? 'Revealing…' : 'Reveal Full Email'}
      </button>
      {error && <div style={{ color: 'crimson', marginTop: 6 }}>{error}</div>}
    </div>
  );
}

import React, { useState } from 'react';

export default function RevealButton({ contactId, payload }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function doReveal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-nh-session': localStorage.getItem('nh_session') || '' },
        body: JSON.stringify({ contactId, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Reveal failed');
      } else {
        setResult(json.revealed);
        // Immediately notify app to refresh account-usage/header
        try {
          // Fire event for header to pick up
          window.dispatchEvent(new Event('account-usage-updated'));
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reveal-button">
      <button onClick={doReveal} disabled={loading} className="btn btn-reveal">
        {loading ? 'Revealing…' : 'Reveal'}
      </button>
      {error && <div className="error">{error}</div>}
      {result && <div className="reveal-result">{JSON.stringify(result)}</div>}
    </div>
  );
}

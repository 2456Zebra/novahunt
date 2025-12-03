// Temporary DebugPanel: add to your homepage (pages/index.js) near the RightPanel import or include where convenient.
// This component will fetch /api/find-company?domain=...&nocache=1 and render the raw JSON so you can paste it here.
// Remove this component after debugging.

import React, { useState } from 'react';

export default function DebugPanel({ domain }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function fetchDebug() {
    setErr(null);
    setLoading(true);
    setPayload(null);
    try {
      const url = `/api/find-company?domain=${encodeURIComponent(domain || 'coca-cola.com')}&nocache=1`;
      const r = await fetch(url, { credentials: 'same-origin' });
      const json = await r.json();
      setPayload(json);
    } catch (e) {
      setErr(String(e && e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 16, padding: 12, borderRadius: 8, border: '1px solid #eee', background: '#fff' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={fetchDebug} style={{ padding: '8px 12px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Fetch API (nocache)
        </button>
        <div style={{ color: '#6b7280' }}>{loading ? 'Loading…' : 'Click to show API JSON'}</div>
      </div>

      {err ? <pre style={{ marginTop: 10, color: 'red' }}>{err}</pre> : null}
      {payload ? (
        <div style={{ marginTop: 10, maxHeight: 420, overflow: 'auto', background: '#0b1220', color: '#e6edf3', padding: 10, borderRadius: 6 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>contacts.length: {(payload && payload.contacts && payload.contacts.length) || 0}</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>total: {payload && payload.total}</div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(payload, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

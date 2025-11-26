import React, { useState } from 'react';
import axios from 'axios';

// Minimal SearchClient: accepts domain input and calls /api/find-emails.
// Calls onResults({ domain, result }) where result = { items: [...], total }
export default function SearchClient({ onResults }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function doSearch(q) {
    const normalized = (q || '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!normalized) return;
    setLoading(true);
    try {
      const url = '/api/find-emails?domain=' + encodeURIComponent(normalized);
      const res = await axios.get(url);
      if (res && res.data && res.data.ok) {
        onResults && onResults({ domain: normalized, result: { items: res.data.emails || [], total: res.data.total || 0 } });
      } else {
        onResults && onResults({ domain: normalized, result: { items: [], total: 0 } });
      }
    } catch (err) {
      onResults && onResults({ domain: normalized, result: { items: [], total: 0 } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter domain, e.g. coca-cola.com"
        onKeyDown={(e) => { if (e.key === 'Enter') doSearch(input); }}
        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e6edf3', width: 420 }}
      />
      <button onClick={() => doSearch(input)} style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' }}>
        {loading ? 'Searching…' : 'Search'}
      </button>
    </div>
  );
}

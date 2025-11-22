import React from 'react';

/**
 * RightPanel — quick company summary and actions for the search results.
 * Place next to SearchClient in pages/index.js or the page that renders SearchClient.
 */
export default function RightPanel({ domain = '', result = { items: [], total: 0 } }) {
  const topDepartments = (() => {
    const counts = {};
    (result.items || []).forEach(it => {
      const d = (it.department || 'Other').trim() || 'Other';
      counts[d] = (counts[d] || 0) + 1;
    });
    const entries = Object.keys(counts).map(k => ({ name: k, count: counts[k] }));
    entries.sort((a, b) => b.count - a.count);
    return entries.slice(0, 6);
  })();

  const topContacts = (result.items || []).slice(0, 6);

  return (
    <aside style={{
      padding: 12,
      borderRadius: 8,
      background: '#ffffff',
      border: '1px solid #eef2f7',
      width: 340,
      boxShadow: '0 6px 20px rgba(15,23,42,0.03)'
    }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Company snapshot</div>

      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
        <div>Domain: <strong>{domain || '—'}</strong></div>
        <div style={{ marginTop: 6 }}>Total results: <strong>{result.total || 0}</strong></div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Top departments</div>
        {topDepartments.length ? topDepartments.map(d => (
          <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#fff7f5', borderRadius: 6, marginBottom: 8 }}>
            <div style={{ color: '#7a341f', fontWeight: 700 }}>{d.name}</div>
            <div style={{ color: '#7a341f' }}>{d.count}</div>
          </div>
        )) : <div style={{ color: '#9ca3af' }}>No departments yet</div>}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Top contacts</div>
        {topContacts.length ? topContacts.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderRadius: 6, background: '#fbfcfe', marginBottom: 8 }}>
            <div style={{ fontSize: 14 }}>
              <div style={{ fontWeight: 700 }}>{c.name || c.email || '—'}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{c.title || c.department || ''}</div>
            </div>
            <div style={{ color: '#2563eb', fontWeight: 600, alignSelf: 'center' }}>Reveal</div>
          </div>
        )) : <div style={{ color: '#9ca3af' }}>No contacts yet</div>}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: '#111827', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Save list
        </button>
        <button style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: '#fff', border: '1px solid #e6e6e6', cursor: 'pointer' }}>
          Export CSV
        </button>
      </div>
    </aside>
  );
}

import React from 'react';

// Decorative corporate/profile block (big C visible, summary)
export default function CorporateProfile({ domain, result }) {
  const companyName = domain ? domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Company';
  const summary = (result && result.items && result.items.length > 0)
    ? `Found ${result.total || result.items.length} contacts.`
    : 'Meet Company: a scrappy team solving problems in surprisingly delightful ways.';

  return (
    <div style={{ background: '#fff', padding: 18, borderRadius: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Big C - visually large and decorative */}
        <div style={{ width: 80, height: 80, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800 }}>
          C
        </div>

        <div style={{ flex: 1 }}>
          {/* Company name (shows actual company from search) */}
          <div style={{ fontWeight: 900, fontSize: 18 }}>{companyName}</div>
          <div style={{ color: '#64748b', marginTop: 8 }}>{summary}</div>

          {/* Removed smaller logo and previous details. Kept show-more/regenerate placeholders */}
          <div style={{ marginTop: 10 }}>
            <button style={{ marginRight: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Show more</button>
            <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Regenerate</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

// Decorative corporate/profile block (matches your "Company" copy).
export default function CorporateProfile({ domain, result }) {
  var companyName = 'Company';
  if (domain) {
    companyName = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  var summary = (result && result.items && result.items.length > 0)
    ? ('Found ' + (result.total || result.items.length) + ' contacts.')
    : 'Meet Company: a scrappy team solving problems in surprisingly delightful ways.';

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
          C
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>{companyName}</div>
          <div style={{ color: '#64748b', marginTop: 6 }}>{summary}</div>
          <div style={{ marginTop: 8 }}>
            <button style={{ marginRight: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Show more</button>
            <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e6edf3', background: '#fff' }}>Regenerate</button>
          </div>
        </div>
      </div>
    </div>
  );
}

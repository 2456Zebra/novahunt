// components/CorporateProfile.jsx
// Small presentational CorporateProfile used by RightPanel.
// Shows decorative copy if no domain provided; otherwise shows summary from result if present.
export default function CorporateProfile({ domain, result }) {
  const companyName = domain ? domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Company';
  const summary = (result && result.items && result.items.length > 0)
    ? `Found ${result.total || result.items.length} contacts.`
    : 'Meet Company: a scrappy team solving problems in surprisingly delightful ways.';

  return (
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
  );
}

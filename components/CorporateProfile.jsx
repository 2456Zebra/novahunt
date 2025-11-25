export default function CorporateProfile({ company }) {
  if (!company) return null;

  return (
    <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
      <h2>{company.name}</h2>
      <p style={{ color: '#6B7280' }}>{company.domain}</p>
      <p><strong>Email:</strong> {company.email || 'N/A'}</p>
      <p><strong>Role:</strong> {company.role || 'N/A'}</p>
      <p><strong>Location:</strong> {company.location || 'N/A'}</p>
    </div>
  );
}

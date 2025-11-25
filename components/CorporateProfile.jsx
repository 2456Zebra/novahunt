// components/CorporateProfile.jsx
export default function CorporateProfile({ company }) {
  console.log('CorporateProfile props:', company);

  if (!company) {
    return (
      <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <p>No company data available</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h3>{company.name}</h3>
      <p><strong>Domain:</strong> {company.domain}</p>
      <p><strong>Email:</strong> {company.email}</p>
      <p><strong>Role:</strong> {company.role}</p>
      <p><strong>Location:</strong> {company.location}</p>
    </div>
  );
}

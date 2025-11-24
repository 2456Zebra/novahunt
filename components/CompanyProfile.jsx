// File: components/CompanyProfile.jsx
import React from 'react';

export default function CompanyProfile({ company }) {
  if (!company) {
    return (
      <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
        <h3>Company Profile</h3>
        <p>No company selected</p>
      </div>
    );
  }

  const { name, logo, tagline, employees, industry, hq, summary } = company;

  return (
    <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
      {logo && <img src={logo} alt={`${name} logo`} style={{ maxWidth: '120px', marginBottom: 12 }} />}
      <h3 style={{ margin: '8px 0', fontSize: '20px' }}>{name}</h3>
      {tagline && <p style={{ fontStyle: 'italic', margin: '4px 0' }}>{tagline}</p>}
      <p style={{ margin: '4px 0' }}>
        {industry ? `Industry: ${industry}` : ''} {employees ? ` | Employees: ${employees}` : ''} {hq ? ` | HQ: ${hq}` : ''}
      </p>
      {summary && <p style={{ marginTop: 8 }}>{summary}</p>}
    </div>
  );
}

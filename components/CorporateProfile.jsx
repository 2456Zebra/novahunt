import React from 'react';

/*
  Minimal CompanyProfile: ensures company link appears under company info.
  If your app already has a profile component, merge the <CompanyLink /> part into it.
*/

function CompanyLink({ url, name }) {
  if (!url) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <a href={url} target="_blank" rel="noreferrer" style={{ color: '#0645AD', textDecoration: 'underline' }}>
        {name || 'Company website'}
      </a>
    </div>
  );
}

export default function CompanyProfile({ company }) {
  if (!company) return null;
  return (
    <div className="company-profile" style={{ padding: 12 }}>
      <div style={{ fontWeight: '600' }}>{company.name}</div>
      <div style={{ color: '#666', marginTop: 6 }}>{company.description}</div>
      <CompanyLink url={company.website} name={company.websiteText || company.name} />
    </div>
  );
}

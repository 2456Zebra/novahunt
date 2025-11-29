import React from 'react';

/*
 RightPanel shows a simple company profile area and the company link under it.
 It reads NEXT_PUBLIC_COMPANY_URL and NEXT_PUBLIC_COMPANY_NAME at build time.
 Set these env vars in Vercel if you want a custom URL/name.
*/

export default function RightPanel({ company }) {
  const url = process.env.NEXT_PUBLIC_COMPANY_URL || (company && company.website) || 'https://novahunt.ai';
  const name = process.env.NEXT_PUBLIC_COMPANY_NAME || (company && company.name) || 'NovaHunt';
  const description = (company && company.description) || 'Find hiring signals with NovaHunt';

  return (
    <aside className="right-panel" style={{ padding: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{name}</div>
      <div style={{ color: '#666', marginTop: 6 }}>{description}</div>
      <div style={{ marginTop: 8 }}>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="company-link"
          style={{ color: '#0645AD', textDecoration: 'underline' }}
        >
          {url}
        </a>
      </div>
    </aside>
  );
}

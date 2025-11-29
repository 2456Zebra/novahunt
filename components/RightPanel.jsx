import React from 'react';

/*
  Minimal RightPanel component to ensure the company profile and company link render.
  It reads NEXT_PUBLIC_COMPANY_NAME and NEXT_PUBLIC_COMPANY_URL if present; otherwise falls back.
  Safe to drop into your existing layout; the right panel markup is isolated.
*/

export default function RightPanel({ company }) {
  const url = process.env.NEXT_PUBLIC_COMPANY_URL || (company && company.website) || 'https://novahunt.ai';
  const name = process.env.NEXT_PUBLIC_COMPANY_NAME || (company && company.name) || 'NovaHunt';
  const description = (company && company.description) || 'Find hiring signals with NovaHunt';

  return (
    <aside className="right-panel" style={{
      padding: 12,
      borderLeft: '1px solid #f0f0f0',
      background: '#fff'
    }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{name}</div>
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

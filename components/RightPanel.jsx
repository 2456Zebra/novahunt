import React from 'react';

/*
  Minimal RightPanel with company profile and single company link placed under the profile.
  Reads NEXT_PUBLIC_COMPANY_NAME and NEXT_PUBLIC_COMPANY_URL if present.
*/
export default function RightPanel({ company }) {
  const url = process.env.NEXT_PUBLIC_COMPANY_URL || (company && company.website) || 'https://novahunt.ai';
  const name = process.env.NEXT_PUBLIC_COMPANY_NAME || (company && company.name) || 'NovaHunt';
  const description = (company && company.description) || 'Find hiring signals with NovaHunt';

  return (
    <aside className="right-panel">
      <div className="company-name">{name}</div>
      <div className="company-desc">{description}</div>
      <div className="company-link-wrap">
        <a className="company-link" href={url} target="_blank" rel="noreferrer">{url}</a>
      </div>

      <style jsx>{`
        .right-panel{ padding:12px; background:#fff; border-left:1px solid #f1f1f1; }
        .company-name{ font-weight:700; margin-bottom:6px; }
        .company-desc{ color:#666; margin-bottom:8px; }
        .company-link{ color:#0645AD; text-decoration:underline; word-break:break-all; }
      `}</style>
    </aside>
  );
}

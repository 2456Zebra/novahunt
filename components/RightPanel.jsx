import React, { useEffect, useState } from 'react';

/*
  Defensive RightPanel:
  - Prefers `company` prop when provided (pages/index.js should pass `data`).
  - Otherwise reads 'nh_company' or 'nh_lastDomain' from localStorage (safe client fallback).
  - Keeps layout flow and won't push/expand the left content.
*/
function readLocalCompany() {
  try {
    const raw = localStorage.getItem('nh_company');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export default function RightPanel({ company }) {
  const [c, setC] = useState(company || null);

  useEffect(() => {
    if (company) {
      setC(company);
      return;
    }
    if (typeof window === 'undefined') return;
    const stored = readLocalCompany();
    if (stored) {
      setC(stored);
      return;
    }
    const lastDomain = localStorage.getItem('nh_lastDomain') || 'coca-cola.com';
    setC({ name: lastDomain, domain: lastDomain, description: '', website: `https://${lastDomain}` });
  }, [company]);

  const name = (c && (c.name || c.domain)) || 'coca-cola.com';
  const description = (c && (c.description || (c.enrichment && c.enrichment.description))) || 'Find hiring signals with NovaHunt';
  const website = (c && (c.website || (c.domain ? `https://${c.domain}` : null))) || 'https://novahunt.ai';

  return (
    <aside className="right-panel">
      <div className="rp-inner">
        <div className="company-name">{name}</div>
        <div className="company-desc">{description}</div>
        <div className="company-link-wrap">
          <a className="company-link" href={website} target="_blank" rel="noreferrer">{website}</a>
        </div>
      </div>

      <style jsx>{`
        .right-panel {
          width: 320px;
          padding: 12px;
          background: #fff;
          border-left: 1px solid #f1f1f1;
          box-sizing: border-box;
          align-self: flex-start;
        }
        .rp-inner { display:flex; flex-direction:column; gap:8px; align-items:flex-start; }
        .company-name { font-weight:700; font-size:16px; }
        .company-desc { color:#666; font-size:13px; line-height:1.3; }
        .company-link { color:#0645AD; text-decoration:underline; word-break:break-all; }
      `}</style>
    </aside>
  );
}

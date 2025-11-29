import React, { useEffect, useState } from 'react';

/*
 RightPanel (client-friendly)
 - Prefers `company` prop when provided.
 - If no prop, reads the last loaded company from localStorage ('nh_company')
   or falls back to domain from 'nh_lastDomain' (default 'coca-cola.com').
 - Ensures it doesn't expand/push layout: no absolute/fixed height; stays top-aligned.
*/

function readLocalCompany() {
  try {
    const raw = localStorage.getItem('nh_company');
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

export default function RightPanel({ company }) {
  const [clientCompany, setClientCompany] = useState(company || null);

  useEffect(() => {
    if (company) {
      setClientCompany(company);
      return;
    }
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Try to read the last-loaded company saved by pages that fetch data client-side
    const fromStorage = readLocalCompany();
    if (fromStorage) {
      setClientCompany(fromStorage);
      return;
    }

    // Fallback: read last domain or default to coca-cola.com
    const lastDomain = localStorage.getItem('nh_lastDomain') || 'coca-cola.com';
    setClientCompany({ name: lastDomain, domain: lastDomain, description: '', website: `https://${lastDomain}` });
  }, [company]);

  const c = clientCompany || {};
  const name = c.name || c.domain || 'coca-cola.com';
  const description = c.description || 'Find hiring signals with NovaHunt';
  const website = c.website || (c.domain ? `https://${c.domain}` : 'https://novahunt.ai');

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
          padding: 12px;
          background: #fff;
          border-left: 1px solid #f1f1f1;
          box-sizing: border-box;
        }
        .rp-inner {
          /* Prevent the panel from stretching/shoving; keep content flow natural */
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
        .company-name { font-weight: 700; font-size: 16px; margin-bottom: 2px; }
        .company-desc { color: #666; font-size: 13px; line-height: 1.3; }
        .company-link { color: #0645AD; text-decoration: underline; word-break: break-all; }
      `}</style>
    </aside>
  );
}

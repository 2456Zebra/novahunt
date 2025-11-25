import React, { useEffect, useState } from 'react';

/*
  CompanyProfile component

  Props:
    - company (optional) : if provided, uses this and skips fetch
    - domain (optional)  : domain to fetch the company for (e.g., "coca-cola.com")
    - className / style   : optional styling

  Behavior:
    - If company prop is present, renders it.
    - Otherwise tries /api/company?domain=<domain>.
    - If API responds non-OK or fails, falls back to /data/<domain>.json (served from public/).
*/

export default function CompanyProfile({ company: companyProp, domain, className = '', style = {} }) {
  const [company, setCompany] = useState(companyProp || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (companyProp) return; // using injected prop
    if (!domain) return;

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // try server API first
        const apiRes = await fetch(`/api/company?domain=${encodeURIComponent(domain)}`);
        if (apiRes.ok) {
          const json = await apiRes.json();
          if (mounted) setCompany(json.company || null);
          setLoading(false);
          return;
        }

        // if API is not OK, fallback to public static JSON
        const fallbackRes = await fetch(`/data/${domain}.json`);
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          if (mounted) setCompany(json || null);
        } else {
          if (mounted) setCompany(null);
        }
      } catch (err) {
        // network error: try fallback static json
        try {
          const fallbackRes = await fetch(`/data/${domain}.json`);
          if (fallbackRes.ok) {
            const json = await fallbackRes.json();
            if (mounted) setCompany(json || null);
          } else {
            if (mounted) setCompany(null);
          }
        } catch (e) {
          if (mounted) setCompany(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [companyProp, domain]);

  if (loading && !company) {
    return (
      <aside className={className} style={{ padding: 16, ...style }}>
        <div style={{ fontSize: 14, color: '#6B7280' }}>Loading company…</div>
      </aside>
    );
  }

  if (!company) {
    return (
      <aside className={className} style={{ padding: 16, ...style }}>
        <div style={{ fontSize: 14, color: '#6B7280' }}>No company profile available</div>
      </aside>
    );
  }

  return (
    <aside className={className} style={{ padding: 16, background: '#fff', borderRadius: 8, ...style }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {company.logo ? (
          <img src={company.logo} alt={company.name} style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8 }} />
        ) : null}
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{company.name || company.domain}</div>
          <div style={{ color: '#6B7280', fontSize: 13 }}>{company.location || ''}</div>
        </div>
      </div>

      {company.description ? (
        <p style={{ marginTop: 12, color: '#374151', fontSize: 14 }}>{company.description}</p>
      ) : null}

      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {company.industry ? <div style={{ padding: '6px 8px', background: '#F3F4F6', borderRadius: 6, fontSize: 13 }}>{company.industry}</div> : null}
        {company.metrics?.employees ? <div style={{ padding: '6px 8px', background: '#F3F4F6', borderRadius: 6, fontSize: 13 }}>{company.metrics.employees} employees</div> : null}
        {company.metrics?.revenue ? <div style={{ padding: '6px 8px', background: '#F3F4F6', borderRadius: 6, fontSize: 13 }}>{company.metrics.revenue} revenue</div> : null}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
        {company.social?.twitter ? <a href={company.social.twitter} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>Twitter</a> : null}
        {company.social?.linkedin ? <a href={company.social.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>LinkedIn</a> : null}
      </div>
    </aside>
  );
}

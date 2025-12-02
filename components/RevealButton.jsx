import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * RightPanel
 *
 * Responsibilities:
 * - Prefer props.data (server-provided company object) when present.
 * - Otherwise fall back to localStorage 'nh_company'.
 * - Persist whichever company we use into localStorage so other tabs / components can read it.
 * - If logo/description missing, attempt a best-effort client-side enrichment via /api/enrich-company.
 *
 * Expected company shape (partial):
 * {
 *   name: 'Acme Inc',
 *   domain: 'acme.com',
 *   logo: 'https://...svg',
 *   description: 'Short description...',
 *   contacts: [...],
 *   total: 123,
 *   shown: 10,
 *   enrichment: { image, description, url, source }
 * }
 */

function readLocalCompany() {
  try {
    const raw = localStorage.getItem('nh_company');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeLocalCompany(company) {
  try {
    if (!company) return;
    localStorage.setItem('nh_company', JSON.stringify(company));
    // also store last domain for convenience
    if (company.domain) localStorage.setItem('nh_lastDomain', company.domain);
    // notify other components/tabs
    window.dispatchEvent(new Event('nh_company_updated'));
  } catch (e) {
    // ignore
  }
}

export default function RightPanel({ domain, data }) {
  const [company, setCompany] = useState(() => {
    // Initialize from prop data or localStorage
    if (data && typeof data === 'object') return data;
    if (typeof window !== 'undefined') return readLocalCompany();
    return null;
  });
  const [loadingEnrich, setLoadingEnrich] = useState(false);

  // If we receive fresh data via props, persist and use it
  useEffect(() => {
    if (data && typeof data === 'object') {
      setCompany(data);
      try { writeLocalCompany(data); } catch (e) {}
    }
  }, [data]);

  // If domain changes and we don't have a logo or description, try to enrich
  useEffect(() => {
    let mounted = true;
    async function maybeEnrich(d) {
      if (!d) return;
      const c = (company && company.domain === d) ? company : null;
      const needsLogo = !(c && c.logo);
      const needsDesc = !(c && c.description);
      if (!needsLogo && !needsDesc) return;

      setLoadingEnrich(true);
      try {
        const res = await fetch(`/api/enrich-company?domain=${encodeURIComponent(d)}`);
        if (!res.ok) return;
        const j = await res.json();
        if (!mounted) return;
        const next = {
          name: (c && c.name) || j.name || d,
          domain: d,
          logo: (c && c.logo) || j.image || null,
          description: (c && c.description) || j.description || '',
          enrichment: { ...(j || {}) },
          contacts: (c && c.contacts) || [],
          total: (c && c.total) || 0,
          shown: (c && c.shown) || 0,
        };
        setCompany(next);
        writeLocalCompany(next);
      } catch (e) {
        // ignore enrichment failures
      } finally {
        if (mounted) setLoadingEnrich(false);
      }
    }

    // Use the explicit domain arg first; if not, try company.domain
    const dToUse = domain || (company && company.domain) || null;
    maybeEnrich(dToUse);

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  // Keep in sync with localStorage changes from other tabs
  useEffect(() => {
    function onCompanyUpdated() {
      const local = readLocalCompany();
      if (local && local.domain === (company && company.domain)) {
        setCompany(local);
      }
    }
    window.addEventListener('storage', onCompanyUpdated);
    window.addEventListener('nh_company_updated', onCompanyUpdated);
    return () => {
      window.removeEventListener('storage', onCompanyUpdated);
      window.removeEventListener('nh_company_updated', onCompanyUpdated);
    };
  }, [company]);

  const logo = (company && (company.logo || (company.enrichment && company.enrichment.image))) || null;
  const name = (company && (company.name || company.domain)) || domain || 'Unknown';
  const description = (company && (company.description || (company.enrichment && company.enrichment.description))) || '';

  return (
    <aside style={{ width: '100%', maxWidth: 320 }}>
      <div style={{ position: 'sticky', top: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {logo ? (
                // keep image contained
                <img src={logo} alt={`${name} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: 22, color: '#6b7280', padding: 8 }}>{(name && name[0]) || 'N'}</div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{company && company.domain ? company.domain : (domain || '')}</div>
            </div>
          </div>

          <div style={{ marginTop: 12, color: '#374151', fontSize: 13, lineHeight: 1.35 }}>
            {description ? description : (loadingEnrich ? 'Looking up company details…' : 'No description available.')}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href={`/plans`}>
              <a style={{ padding: '6px 10px', background: '#10b981', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>Upgrade</a>
            </Link>

            <Link href={`/about`}>
              <a style={{ padding: '6px 10px', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>About</a>
            </Link>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e6edf3', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Results</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{(company && company.shown) || 0}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>shown</div>
          </div>

          <div style={{ height: 8 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{(company && (company.total || (company.contacts && company.contacts.length))) || 0}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>total</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

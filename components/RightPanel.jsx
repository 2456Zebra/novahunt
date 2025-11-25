import React, { useEffect, useState, useCallback } from 'react';
import CompanyProfile from './CompanyProfile';

export default function RightPanel({ domain, result }) {
  const [company, setCompany] = useState(result?.company || null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // mark when we're on the client so we avoid SSR/client HTML mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to fetch company info (calls pages/api/company)
  const fetchCompany = useCallback(async (d, regenerate = false) => {
    if (!d) {
      setCompany(null);
      return;
    }

    // If result already includes company, prefer that
    if (result && result.company) {
      setCompany(result.company);
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const url = `/api/company?domain=${encodeURIComponent(d)}${regenerate ? '&regenerate=1' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Company API error: ${res.status}`);
      const payload = await res.json();
      setCompany(payload.company || null);
    } catch (err) {
      console.error('Company fetch failed', err);
      setFetchError('Failed to load company info.');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [result]);

  // Load when domain or result changes (client-side only)
  useEffect(() => {
    if (mounted) {
      fetchCompany(domain, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, result, mounted]);

  const handleRegenerate = async () => {
    await fetchCompany(domain, true);
  };

  return (
    <aside>
      <div style={{ marginBottom: 14 }}>
        {/* Render CompanyProfile only on the client to avoid hydration mismatch */}
        {mounted ? (
          <CompanyProfile company={company} domain={domain} onRegenerate={handleRegenerate} />
        ) : (
          <div style={{ height: 260, background: '#fff' }} aria-hidden />
        )}
      </div>

      <div style={{ marginTop: 12, padding: 16, border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff' }}>
        <h4 style={{ marginTop: 0 }}>Top contacts</h4>
        {result && result.items && result.items.length ? (
          <ul style={{ paddingLeft: 18, marginTop: 8 }}>
            {result.items.slice(0, 4).map((c, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{c.name || c.email}</div>
                <div style={{ color: '#6B7280', fontSize: 13 }}>{c.role || c.title || ''} {c.company && `• ${c.company}`}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#6B7280' }}>No contacts found yet.</p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button style={{ flex: 1, padding: '10px 12px', borderRadius: 6 }}>View Results</button>
          <button style={{ padding: '10px 12px', borderRadius: 6 }}>Export</button>
        </div>
      </div>

      {loading && <p style={{ color: '#6B7280', marginTop: 8 }}>Loading company data…</p>}
      {fetchError && <p style={{ color: '#DC2626', marginTop: 8 }}>{fetchError}</p>}
    </aside>
  );
}

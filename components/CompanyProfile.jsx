import React from 'react';

/**
 * CompanyProfile — decorative, read-only company info panel for the search results page.
 * Props:
 *  - domain (string) — searched domain
 *  - result (object) — latest search result (optional)
 *
 * This component is intentionally lightweight and SSR-safe (no network calls at module load).
 */

const styles = {
  container: { padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #eee' },
  title: { fontSize: 16, fontWeight: 800 },
  summary: { color: '#444', marginTop: 8, lineHeight: 1.45 },
  facts: { marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  fact: { background: '#fafafa', padding: 8, borderRadius: 6, fontSize: 13 },
  subtle: { color: '#666', fontSize: 13 },
};

const safeHostFromDomain = (domain) => {
  if (!domain) return null;
  try {
    return new URL(domain.startsWith('http') ? domain : `https://${domain}`).hostname.replace('www.', '');
  } catch {
    return domain;
  }
};

export default function CompanyProfile({ domain = '', result = { items: [], total: 0 } }) {
  const host = safeHostFromDomain(domain);
  const total = (result && (result.total ?? result.items?.length)) || 0;

  return (
    <aside style={styles.container} aria-live="polite">
      <div style={styles.title}>Company profile</div>

      <div style={styles.subtle} aria-hidden>{host || 'No domain selected'}</div>

      <div style={styles.summary}>
        {host ? (
          <>
            This panel shows a short overview of the selected domain and search context. It is decorative and intended to add
            contextual value next to the results.
          </>
        ) : (
          <>Select a search result to see a conversational company profile here.</>
        )}
      </div>

      <div style={styles.facts}>
        <div style={styles.fact}>
          <div style={styles.subtle}>Search results</div>
          <div style={{ fontWeight: 700, marginTop: 6 }}>{total}</div>
        </div>

        <div style={styles.fact}>
          <div style={styles.subtle}>Source</div>
          <div style={{ fontWeight: 700, marginTop: 6 }}>{result.public ? 'Public' : 'Private'}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }} className="company-profile-note">
        <div style={styles.subtle}>Enrichment</div>
        <div style={{ marginTop: 6, color: '#444' }}>
          If you enable an enrichment provider (CLEARBIT_API_KEY or similar) this panel can show a richer profile (logo,
          description, HQ, founded, website). No provider is called here by default to keep server builds stable.
        </div>
      </div>
    </aside>
  );
}

import React, { useState, useMemo } from 'react';
import CompanyProfile from '../src/components/CompanyProfile/CompanyProfile';

/**
 * SearchResults
 * Left: compact list of results
 * Right: CompanyProfile sidebar for the selected item
 *
 * Usage: <SearchResults results={resultsArray} />
 * Each result may include fields like:
 *  { name, industry, founded, size, location, description, logo, website }
 *
 * SSR-safe: any URL parsing is wrapped in try/catch; image onError falls back to placeholder.
 */

const styles = {
  container: { display: 'flex', gap: '20px', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box' },
  left: { flex: '1 1 45%', paddingRight: '10px', minWidth: 280 },
  right: { flex: '1 1 55%', paddingLeft: '20px', borderLeft: '1px solid #e3e3e3', minWidth: 300 },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 10px',
    borderRadius: 8,
    marginBottom: 8,
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    gap: 12,
  },
  revealButton: {
    padding: '6px 8px',
    fontSize: 12,
    borderRadius: 6,
    border: '1px solid #ddd',
    background: '#f7f7f8',
    cursor: 'pointer',
    flex: '0 0 auto',
  },
  resultName: { fontWeight: 600, fontSize: 15 },
  logo: {
    maxWidth: 160,
    maxHeight: 90,
    objectFit: 'contain',
    borderRadius: 8,
    border: '1px solid #eee',
    background: '#fff',
    padding: 8,
  },
  profileHeader: { display: 'flex', gap: 16, alignItems: 'center' },
  profileTitle: { margin: 0, fontSize: 20 },
  factsList: {
    listStyle: 'none',
    padding: 0,
    margin: '8px 0 0 0',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 8,
  },
  factItem: { background: '#fafafa', padding: '8px', borderRadius: 6, fontSize: 13 },
  subtle: { color: '#666', fontSize: 13 },
  websiteLink: { display: 'inline-block', marginTop: 12, color: '#0366d6', textDecoration: 'none', fontWeight: 600 },
  noResults: { color: '#666', padding: '12px', background: '#fff', borderRadius: 8 },
};

const PlaceholderLogo = ({ name }) => {
  const initials = (name || 'Co')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const bgColor = '#f0f4f8';
  return (
    <div
      aria-hidden
      style={{
        width: 120,
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        background: bgColor,
        color: '#556',
        fontWeight: 700,
        fontSize: 22,
        border: '1px solid #eee',
      }}
    >
      {initials}
    </div>
  );
};

const buildConversationalProfile = (r) => {
  if (!r) return '';
  const parts = [];
  if (r.name) parts.push(`${r.name} is a${r.industry ? ` ${r.industry}` : ''} company${r.location ? ` based in ${r.location}` : ''}.`);
  if (r.founded || r.size) {
    const foundedPart = r.founded ? `founded in ${r.founded}` : null;
    const sizePart = r.size ? `${r.size} employees` : null;
    const combo = [foundedPart, sizePart].filter(Boolean).join(' and ');
    if (combo) parts.push(`It was ${combo}.`);
  }
  if (r.description) parts.push(r.description);
  else parts.push(`Today, ${r.name || 'the company'} focuses on delivering customer value through its products and services${r.website ? ` — learn more at ${r.website}` : '.'}`);
  if (r.mission) parts.push(`${r.name}’s mission: ${r.mission}`);
  else if (r.recent) parts.push(`Recent highlights: ${r.recent}`);
  parts.push('Below are some quick facts and additional context to help you understand the company at a glance.');
  return parts.join(' ');
};

const QuickFact = ({ label, value }) => {
  if (!value) return null;
  return (
    <div style={styles.factItem}>
      <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
};

const SearchResults = ({ results = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(results.length > 0 ? 0 : -1);
  const selected = useMemo(() => (selectedIndex >= 0 ? results[selectedIndex] : null), [results, selectedIndex]);

  const handleReveal = (i) => {
    setSelectedIndex(i);
    // safe client-only scroll after user click
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const profileEl = document.getElementById('company-profile');
        if (profileEl) profileEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  return (
    <>
      <style>{`
          @media (max-width: 860px) {
            .search-results-root { flex-direction: column; }
            .search-left { padding-right: 0 !important; }
            .search-right { border-left: none !important; padding-left: 0 !important; margin-top: 16px; }
          }
          .result-item:hover { transform: translateY(-1px); transition: transform 120ms ease; box-shadow: 0 4px 10px rgba(19,20,21,0.04); }
          .reveal-button:focus { outline: 2px solid rgba(3,102,214,0.18); }
      `}</style>

      <div className="search-results-root" style={styles.container}>
        <div className="search-left" style={styles.left}>
          <h2 style={{ marginTop: 0 }}>Search Results</h2>

          {results.length === 0 && <div style={styles.noResults}>No results found. Try different keywords or filters.</div>}

          {results.map((result, idx) => (
            <div
              key={idx}
              className="result-item"
              style={{
                ...styles.resultItem,
                border: selectedIndex === idx ? '1px solid #cfe3ff' : styles.resultItem.border,
                background: selectedIndex === idx ? '#f6fbff' : styles.resultItem.background,
              }}
            >
              <button
                aria-pressed={selectedIndex === idx}
                aria-label={`Reveal company profile for ${result.name || 'result'}`}
                onClick={() => handleReveal(idx)}
                className="reveal-button"
                style={styles.revealButton}
                title={`Reveal ${result.name || 'profile'}`}
              >
                Reveal
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={styles.resultName}>{result.name || 'Untitled'}</div>
                <div style={styles.subtle}>{result.industry ? result.industry + (result.location ? ` • ${result.location}` : '') : result.location || ''}</div>
              </div>
            </div>
          ))}
        </div>

        <div id="company-profile" className="search-right" style={styles.right} aria-live="polite">
          <CompanyProfile company={selected} />
        </div>
      </div>
    </>
  );
};

export default SearchResults;

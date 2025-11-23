import React, { useState, useMemo } from 'react';
import CompanyProfile from '../src/components/CompanyProfile/CompanyProfile';

/**
 * SearchResults
 * Left: compact list of results
 * Right: CompanyProfile sidebar component for the selected item
 *
 * Usage: <SearchResults results={resultsArray} />
 * Each result may include fields like:
 *  { name, industry, founded, size, location, description, logo, website }
 *
 * SSR-safe: any URL parsing is wrapped in try/catch; image onError falls back to placeholder.
 */

const styles = {
  container: { display: 'flex', gap: '20px', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box' },
  left: { flex: '1 1 60%', paddingRight: '10px', minWidth: 280 },
  right: { flex: '0 0 auto' },
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
  subtle: { color: '#666', fontSize: 13 },
  noResults: { color: '#666', padding: '12px', background: '#fff', borderRadius: 8 },
};

const SearchResults = ({ results = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(results.length > 0 ? 0 : -1);
  const selected = useMemo(() => (selectedIndex >= 0 ? results[selectedIndex] : null), [results, selectedIndex]);

  // Transform selected result to company format for CompanyProfile component
  const companyData = useMemo(() => {
    if (!selected) return null;
    return {
      name: selected.name,
      logoUrl: selected.logo || selected.logoUrl,
      industry: selected.industry,
      location: selected.location,
      employeeCount: selected.size,
      website: selected.website,
      description: selected.description || selected.longDescription,
      linkedin: selected.linkedin,
      twitter: selected.twitter,
      rating: selected.rating,
      openPositions: selected.openPositions,
    };
  }, [selected]);

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

  const hideProfile = () => setSelectedIndex(-1);

  return (
    <>
      <style>{`
          @media (max-width: 860px) {
            .search-results-root { flex-direction: column; }
            .search-left { padding-right: 0 !important; }
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

        <div id="company-profile" className="search-right" style={styles.right}>
          <CompanyProfile company={companyData} loading={false} onClose={hideProfile} />
        </div>
      </div>
    </>
  );
};

export default SearchResults;

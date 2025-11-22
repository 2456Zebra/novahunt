import React, { useState } from 'react';
import SearchClient from '../components/SearchClient';
import SearchResults from '../components/SearchResults';

/**
 * Temporary preview page for the new search results UI.
 * - Does not modify the existing /search route.
 * - Visit /search-v2 to validate the left results + right company profile layout.
 */

export default function SearchPageV2() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Search (preview)</h1>

      {/* SearchClient will call onResults({ domain, result }) */}
      <SearchClient
        onResults={({ domain: d, result: r }) => {
          setDomain(d || '');
          setResult(r || { items: [], total: 0, public: true });
        }}
      />

      {/* Render the new SearchResults component (left results + company profile) */}
      <div style={{ marginTop: 20 }}>
        <SearchResults results={result.items || []} />
      </div>

      <div style={{ marginTop: 18, color: '#666', fontSize: 13 }}>
        This is a preview page. If everything looks good here, we can integrate the same layout into the primary /search route.
      </div>
    </div>
  );
}

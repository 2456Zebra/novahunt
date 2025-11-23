import React, { useState } from 'react';
import SearchInputPreview from '../components/SearchInputPreview';
import SearchResults from '../components/SearchResults';

/**
 * /search-v2 — preview page for the new search results UI.
 * - Uses SearchInputPreview (isolated input) so the homepage's SearchClient is not modified.
 * - Renders SearchResults for left results + right company profile.
 * - This route is safe to iterate on; it does not modify pages/search.js.
 */

export default function SearchPageV2() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Search (preview)</h1>

      <SearchInputPreview
        onResults={({ domain: d, result: r }) => {
          setDomain(d || '');
          setResult(r || { items: [], total: 0, public: true });
        }}
      />

      <div style={{ marginTop: 20 }}>
        <SearchResults results={result.items || []} />
      </div>

      <div style={{ marginTop: 18, color: '#666', fontSize: 13 }}>
        This is a preview page. If everything looks good here, we can integrate the same layout into the primary /search route.
      </div>
    </div>
  );
}

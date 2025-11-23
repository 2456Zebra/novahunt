import React, { useState } from 'react';
import SearchInputPreview from '../components/SearchInputPreview';
import SearchResults from '../components/SearchResults';
import CompanyProfile from '../components/CompanyProfile';

/**
 * pages/search.js
 *
 * This file replaces the /search route to include the new Company Profile in a way that
 * does NOT touch the site-wide SearchClient used by other pages (homepage remains unchanged).
 *
 * Behavior:
 * - Uses SearchInputPreview (isolated input) to perform searches and receive normalized results.
 * - Renders SearchResults which shows left-hand list + right-hand CompanyProfile.
 *
 * If you prefer to flip this on/off remotely, add a NEXT_PUBLIC_USE_NEW_SEARCH env var and guard rendering.
 * For now this is the /search implementation you asked for.
 */

export default function SearchPage() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Search</h1>

      <SearchInputPreview
        onResults={({ domain: d, result: r }) => {
          setDomain(d || '');
          setResult(r || { items: [], total: 0, public: true });
        }}
      />

      <div style={{ marginTop: 20 }}>
        <SearchResults results={result.items || []} />
      </div>

      {/* Keep an accessible, minimal CompanyProfile instance for SEO/assistive tech */}
      <div style={{ marginTop: 18, display: 'none' }}>
        <CompanyProfile domain={domain} result={result} />
      </div>
    </div>
  );
}

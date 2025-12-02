import React, { useState } from 'react';
import SearchClient from '../components/SearchClient';
import SearchResults from '../components/SearchResults';
import CompanyProfile from '../components/CompanyProfile';

/**
 * pages/search.js — feature-flagged switch between old and new search UI.
 * Set NEXT_PUBLIC_USE_NEW_SEARCH=true in Vercel to enable new SearchResults layout.
 */

export default function SearchPage() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  const useNew = typeof window !== 'undefined' ? window?.__USE_NEW_SEARCH : (process?.env?.NEXT_PUBLIC_USE_NEW_SEARCH === 'true');

  // keep onResults behavior identical; SearchClient not changed
  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Search</h1>

      <SearchClient
        onResults={({ domain: d, result: r }) => {
          setDomain(d || '');
          setResult(r || { items: [], total: 0, public: true });
        }}
      />

      {useNew ? (
        // New consolidated layout (SearchResults handles left + right)
        <div style={{ marginTop: 20 }}>
          <SearchResults results={result.items || []} />
        </div>
      ) : (
        // Existing / original layout (keeps current behavior)
        <div style={{ display: 'flex', gap: 20, marginTop: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 60%' }}>
            {/* The existing results UI can be kept or the older components placed here */}
            <SearchResults results={result.items || []} />
          </div>
          <div style={{ flex: '1 1 40%', minWidth: 280 }}>
            <CompanyProfile domain={domain} result={result} />
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import SearchClient from '../components/SearchClient';
import SearchResults from '../components/SearchResults';
import CompanyProfile from '../components/CompanyProfile';

export default function SearchPage() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Search</h1>

      {/* SearchClient will call onResults({ domain, result }) */}
      <SearchClient
        onResults={({ domain: d, result: r }) => {
          setDomain(d || '');
          setResult(r || { items: [], total: 0, public: true });
        }}
      />

      {/* 50/50 split: left results, right company profile */}
      <div style={{ display: 'flex', gap: 20, marginTop: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 50%' }}>
          <SearchResults results={result.items || []} />
        </div>

        <div style={{ flex: '1 1 50%', minWidth: 300 }}>
          <CompanyProfile domain={domain} result={result} />
        </div>
      </div>
    </div>
  );
}

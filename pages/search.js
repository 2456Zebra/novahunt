import React, { useState } from 'react';
import SearchClient from '../components/SearchClient';
import CompanyProfile from '../components/CompanyProfile';

export default function SearchPage() {
  // Lifted state: domain & result from SearchClient via onResults callback
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Search</h1>

      {/* Two equal columns: left = results, right = company profile */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <div>
          {/* SearchClient calls onResults({ domain, result }) after each fetch */}
          <SearchClient onResults={({ domain: d, result: r }) => { setDomain(d || ''); setResult(r || { items: [], total: 0 }); }} />
        </div>

        <div>
          <CompanyProfile domain={domain} result={result} />
        </div>
      </div>
    </main>
  );
}

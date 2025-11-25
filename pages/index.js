// pages/index.js
import React, { useState } from 'react';
import SearchClient from '../components/SearchClient';
import RightPanel from '../components/RightPanel';

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  return (
    <main style={{ padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        <div>
          <SearchClient
            onResults={({ domain: d, result: r }) => {
              setDomain(d || '');
              setResult(r || { items: [], total: 0 });
            }}
          />
        </div>
        <div>
          <RightPanel domain={domain} result={result} />
        </div>
      </div>
    </main>
  );
}

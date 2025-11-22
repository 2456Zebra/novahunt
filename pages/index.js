import React, { useState } from 'react';
import SearchClient from '../components/SearchClient';
import RightPanel from '../components/RightPanel';

export default function HomePage() {
  // Lifted state: domain & result from SearchClient via onResults callback
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  return (
    <main style={{ padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        <div>
          {/* Provide onResults so SearchClient can notify parent with domain/result */}
          <SearchClient onResults={({ domain: d, result: r }) => { setDomain(d || ''); setResult(r || { items: [], total: 0 }); }} />
        </div>

        <div>
          <RightPanel domain={domain} result={result} />
        </div>
      </div>
    </main>
  );
}

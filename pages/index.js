// pages/index.js
import React, { useState } from 'react';
import SearchClient from '../components/SearchClient';
import RightPanel from '../components/RightPanel';
import Link from 'next/link';

export default function HomePage() {
  // Lifted state: domain & result from SearchClient via onResults callback
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  return (
    <main style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero Section */}
      <section style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 20 }}>NovaHunt</h1>
        <p style={{ fontSize: 20, marginBottom: 30 }}>
          Find business emails instantly. Enter a company domain, and get professional email results.
        </p>
        <Link href="/search">
          <button style={{
            padding: '14px 26px',
            fontSize: 18,
            cursor: 'pointer',
            borderRadius: 8,
            border: '1px solid #333',
            background: '#000',
            color: '#fff'
          }}>
            Start Searching
          </button>
        </Link>
      </section>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Left Column: SearchClient */}
        <div>
          <SearchClient 
            onResults={({ domain: d, result: r }) => { 
              setDomain(d || ''); 
              setResult(r || { items: [], total: 0 }); 
            }} 
          />
        </div>

        {/* Right Column: CorporateProfile */}
        <div>
          <RightPanel domain={domain} result={result} />
        </div>
      </div>

      {/* Optional Footer / Info Sections */}
      <section style={{ marginTop: 60 }}>
        <h2>About NovaHunt</h2>
        <p>
          NovaHunt helps you find verified business emails for professionals in any company.
        </p>
        <h2>Plans</h2>
        <p>
          Choose a plan that fits your needs, from free to enterprise options.
        </p>
      </section>
    </main>
  );
}

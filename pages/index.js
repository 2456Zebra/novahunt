// pages/index.js
import React, { useState } from 'react';
import SearchClient from '../components/SearchClient';
import RightPanel from '../components/RightPanel';
import Link from 'next/link';
import ErrorBoundary from '../components/ErrorBoundary';

export default function HomePage() {
  // Lifted state for search domain and results
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  return (
    <main style={{ padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      <ErrorBoundary>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
          {/* Left column: Search and intro content */}
          <div>
            <h1 style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 20 }}>NovaHunt</h1>
            <p style={{ fontSize: 20, marginBottom: 30 }}>
              Find business emails instantly. Enter a company domain, and get professional email results.
            </p>

            {/* SearchClient component */}
            <SearchClient
              onResults={({ domain: d, result: r }) => {
                setDomain(d || '');
                setResult(r || { items: [], total: 0 });
              }}
            />

            {/* Optional quick links / calls to action */}
            <div style={{ marginTop: 30 }}>
              <Link href="/plans" legacyBehavior>
                <a>
                  <button
                    style={{
                      padding: '12px 24px',
                      fontSize: 16,
                      cursor: 'pointer',
                      borderRadius: 6,
                      border: '1px solid #333',
                      background: '#000',
                      color: '#fff',
                      marginRight: 10
                    }}
                  >
                    See Plans
                  </button>
                </a>
              </Link>
              <Link href="/about" legacyBehavior>
                <a>
                  <button
                    style={{
                      padding: '12px 24px',
                      fontSize: 16,
                      cursor: 'pointer',
                      borderRadius: 6,
                      border: '1px solid #333',
                      background: '#f5f5f5',
                      color: '#000'
                    }}
                  >
                    About
                  </button>
                </a>
              </Link>
            </div>
          </div>

          {/* Right column: Corporate profile panel */}
          <div>
            <RightPanel domain={domain} result={result} />
          </div>
        </div>

        {/* Additional homepage sections */}
        <section style={{ marginTop: 60 }}>
          <h2>How it works</h2>
          <p>
            Enter a company domain, see all publicly available emails, and reveal verified email addresses.
          </p>
          <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
            <div style={{ flex: 1, padding: 20, border: '1px solid #E5E7EB', borderRadius: 8 }}>
              <h3>Step 1</h3>
              <p>Search a company domain.</p>
            </div>
            <div style={{ flex: 1, padding: 20, border: '1px solid #E5E7EB', borderRadius: 8 }}>
              <h3>Step 2</h3>
              <p>Browse results and find emails.</p>
            </div>
            <div style={{ flex: 1, padding: 20, border: '1px solid #E5E7EB', borderRadius: 8 }}>
              <h3>Step 3</h3>
              <p>Export or reveal professional emails.</p>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 60 }}>
          <h2>Features</h2>
          <ul style={{ listStyle: 'disc', marginLeft: 20 }}>
            <li>Instant company email search</li>
            <li>Verified professional emails</li>
            <li>Role-based filtering</li>
            <li>Location-based search</li>
            <li>Easy export for CRM integration</li>
          </ul>
        </section>

        <section style={{ marginTop: 60, textAlign: 'center' }}>
          <h2>Get Started</h2>
          <p>Create an account and start finding emails today.</p>
          <Link href="/signup" legacyBehavior>
            <a>
              <button
                style={{
                  padding: '14px 26px',
                  fontSize: 18,
                  cursor: 'pointer',
                  borderRadius: 8,
                  border: '1px solid #333',
                  background: '#000',
                  color: '#fff'
                }}
              >
                Sign Up
              </button>
            </a>
          </Link>
        </section>

        <footer style={{ marginTop: 80, borderTop: '1px solid #E5E7EB', paddingTop: 20 }}>
          <p style={{ color: '#6B7280' }}>© 2025 NovaHunt. All rights reserved.</p>
        </footer>
      </ErrorBoundary>
    </main>
  );
}

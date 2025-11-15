import React from 'react';
import Head from 'next/head';

export default function SearchPage() {
  return (
    <>
      <Head>
        <title>Search — NovaHunt</title>
      </Head>

      <main style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
        <h1>Search</h1>
        <p>Enter a domain to search for contacts and email addresses.</p>

        {/* Basic UI placeholder — your existing search UI can be re-used here */}
        <div style={{ marginTop: 20 }}>
          <form id="domain-search-form" onSubmit={(e) => {
            e.preventDefault();
            const domain = (document.getElementById('domain-input') || {}).value || '';
            if (!domain) {
              alert('Please enter a domain');
              return;
            }
            // Navigate to your existing search results route (if you already have one), otherwise call your search API.
            window.location.href = `/search?domain=${encodeURIComponent(domain)}`;
          }}>
            <input id="domain-input" name="domain" placeholder="example.com" style={{ padding: 8, width: '320px' }} />
            <button type="submit" style={{ marginLeft: 8, padding: '8px 12px' }}>Search</button>
          </form>
        </div>
      </main>
    </>
  );
}

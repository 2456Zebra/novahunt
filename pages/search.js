import React, { useState } from 'react';
import SearchClient from '../components/SearchClient';
import CompanyProfile from '../components/CompanyProfile';

// New preview-only components (safe, isolated)
import SearchInputPreview from '../components/SearchInputPreview';
import SearchResults from '../components/SearchResults';

/**
 * Feature-flagged /search page.
 *
 * Toggle the new layout by setting NEXT_PUBLIC_USE_NEW_SEARCH=true in the environment
 * (Vercel: Project → Settings → Environment Variables). By default the page renders
 * the existing SearchClient behavior so production remains unchanged.
 *
 * This file does not modify any shared components; it only chooses which UI to render.
 */

export default function SearchPage() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState({ items: [], total: 0, public: true });

  // Feature flag read from build/runtime environment
  const useNew = process?.env?.NEXT_PUBLIC_USE_NEW_SEARCH === 'true';

  // onResults handler for either input component to update local state
  const handleResults = ({ domain: d, result: r }) => {
    setDomain(d || '');
    setResult(r || { items: [], total: 0, public: true });
  };

  // Old/stable path: keep using the existing SearchClient (unchanged behavior)
  if (!useNew) {
    return (
      <div style={{ padding: 20 }}>
        <h1 style={{ marginTop: 0 }}>Search</h1>

        {/* Existing behavior — SearchClient continues to handle input + internal results */}
        <SearchClient onResults={handleResults} />

        {/* Keep an accessible, minimal CompanyProfile instance off-screen for assistive tech or SEO */}
        <div style={{ marginTop: 18, display: 'none' }}>
          <CompanyProfile domain={domain} result={result} />
        </div>
      </div>
    );
  }

  // New layout path: isolated preview input + SearchResults + CompanyProfile
  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Search</h1>

      {/* Isolated preview input — does not change the global/shared SearchClient used by other pages */}
      <SearchInputPreview onResults={handleResults} />

      {/* New consolidated layout: left results + right company profile */}
      <div style={{ marginTop: 20 }}>
        <SearchResults results={result.items || []} />
      </div>

      {/* Keep a minimal CompanyProfile instance hidden for semantic purposes (optional) */}
      <div style={{ marginTop: 18, display: 'none' }}>
        <CompanyProfile domain={domain} result={result} />
      </div>
    </div>
  );
}

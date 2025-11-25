import React, { useState } from 'react';
import ResultItem from './ResultItem';
import CorporateProfile from './CorporateProfile';

export default function SearchResults({ results }) {
  const [selectedDomain, setSelectedDomain] = useState(null);

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: 1 }}>
        {results.length === 0 && <p>No results found.</p>}
        {results.map(result => (
          <ResultItem 
            key={result.email} 
            result={result} 
            onSelect={() => setSelectedDomain(result.domain)}
          />
        ))}
      </div>
      <CorporateProfile domain={selectedDomain} />
    </div>
  );
}

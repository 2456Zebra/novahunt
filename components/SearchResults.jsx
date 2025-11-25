import { useState } from 'react';
import ResultItem from './ResultItem';
import CorporateProfile from './CorporateProfile';
import RightPanel from './RightPanel'; // optional if you already use it

export default function SearchResults({ results }) {
  // Track which result is selected for the Corporate Profile
  const [selectedResult, setSelectedResult] = useState(null);

  const handleSelectResult = (result) => {
    setSelectedResult(result);
  };

  return (
    <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
      {/* Left side: list of results */}
      <div style={{ flex: 2 }}>
        {results && results.length ? (
          results.map((result) => (
            <div key={result.id} onClick={() => handleSelectResult(result)}>
              <ResultItem result={result} />
            </div>
          ))
        ) : (
          <p>No results found.</p>
        )}
      </div>

      {/* Right side: Corporate Profile */}
      <div style={{ flex: 1, minWidth: '300px' }}>
        {selectedResult ? (
          <CorporateProfile company={selectedResult.company} />
        ) : (
          <p style={{ color: '#6B7280' }}>Select a result to see corporate profile.</p>
        )}
      </div>
    </div>
  );
}

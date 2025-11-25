// components/SearchResults.jsx
import React, { useState } from 'react';
import ResultItem from './ResultItem';
import RightPanel from './RightPanel';
import CompanyProfile from './CompanyProfile';

export default function SearchResults({ results }) {
  const [selectedCompany, setSelectedCompany] = useState(null);

  return (
    <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
      {/* Left: List of results */}
      <div style={{ flex: 2 }}>
        {results && results.length > 0 ? (
          results.map((item) => (
            <ResultItem
              key={item.id}
              item={item}
              onClick={() => setSelectedCompany(item)}
            />
          ))
        ) : (
          <p>No results found</p>
        )}
      </div>

      {/* Right: Corporate Profile */}
      <div style={{ flex: 1 }}>
        {selectedCompany ? (
          <RightPanel>
            <CompanyProfile company={selectedCompany} />
          </RightPanel>
        ) : (
          <p>Select a company to see details</p>
        )}
      </div>
    </div>
  );
}

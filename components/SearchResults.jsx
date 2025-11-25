// components/SearchResults.jsx
import React, { useState } from "react";
import ResultItem from "./ResultItem";
import CorporateProfile from "./CorporateProfile";

export default function SearchResults({ results }) {
  const [selectedCompany, setSelectedCompany] = useState(null);

  return (
    <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
      {/* Left column: search results */}
      <div style={{ flex: 2 }}>
        {results.length === 0 ? (
          <p>No results found.</p>
        ) : (
          results.map((item) => (
            <ResultItem
              key={item.email}
              item={item}
              onSelect={() => setSelectedCompany(item)}
            />
          ))
        )}
      </div>

      {/* Right column: Corporate Profile */}
      <div style={{ flex: 1 }}>
        {selectedCompany ? (
          <CorporateProfile company={selectedCompany} />
        ) : (
          <p>Select a company from the left to see the profile.</p>
        )}
      </div>
    </div>
  );
}

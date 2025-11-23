import React, { useState } from 'react';
import SearchInputPreview from '../components/SearchInputPreview';
import ResultsWithSidebar from '../components/ResultsWithSidebar';

/**
 * /search-v2 — preview page for new search results UI.
 * This file renders the isolated search input and the ResultsWithSidebar wrapper
 * which shows SearchResults on the left and CompanyProfile on the right.
 *
 * This minimal implementation preserves any existing header/layout and only
 * swaps the search-results area to use the wrapper component you added.
 */
export default function SearchV2Page(props) {
  // If the original file had local state or fetching, keep it.
  // We include a local results state to avoid breaking the page if no fetch exists here.
  const [results, setResults] = useState([]);

  return (
    <div>
      {/* keep the isolated preview search input */}
      <SearchInputPreview />

      {/* Render the wrapper that contains SearchResults + CompanyProfile sidebar.
          Pass whatever `results` or other props you were already using here.
          If your original file used result.items, change the prop accordingly. */}
      <ResultsWithSidebar results={results} {...props} />
    </div>
  );
}

import React, { useState } from 'react';
import SearchInputPreview from '../components/SearchInputPreview';
import ResultsWithSidebar from '../components/ResultsWithSidebar';

/**
 * /search-v2 — preview page for new search results UI.
 * This file renders the isolated search input and the ResultsWithSidebar wrapper
 * which shows SearchResults on the left and CompanyProfile on the right.
 *
 * Minimal, safe implementation: preserves header/layout and only swaps the results area.
 */
export default function SearchV2Page(props) {
  // If your original file populated `results` from an API, keep that logic.
  // For a safe smoke-check we render with an empty array so the page compiles.
  const [results] = useState([]);

  return (
    <div>
      <SearchInputPreview />
      <ResultsWithSidebar results={results} {...props} />
    </div>
  );
}

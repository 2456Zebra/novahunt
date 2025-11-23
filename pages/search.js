import React from "react";
import SearchInputPreview from '../components/SearchInputPreview';
import ResultsWithSidebar from '../components/ResultsWithSidebar';

/**
 * /search — main search page (feature-flagged).
 * This minimal edit renders the ResultsWithSidebar wrapper so the CompanyProfile appears.
 */
export default function SearchPage(props) {
  return (
    <div>
      <SearchInputPreview />
      <ResultsWithSidebar {...props} />
    </div>
  );
}

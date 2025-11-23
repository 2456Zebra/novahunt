import React from "react";
import SearchInputPreview from '../components/SearchInputPreview';
import SearchResults from '../components/SearchResults';

export default function SearchPage(props) {
  return (
    <div>
      <SearchInputPreview />
      <SearchResults {...props} />
    </div>
  );
}

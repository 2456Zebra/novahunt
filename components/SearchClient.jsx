import { useState } from 'react';
import SearchResults from './SearchResults';
import CorporateProfile from './CorporateProfile';
import SearchInputPreview from './SearchInputPreview';

export default function SearchClient() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (domain) => {
    try {
      const res = await fetch(`/api/search-contacts?domain=${domain}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setSelectedCompany(null); // reset selected company on new search
    } catch (err) {
      console.error('Search error', err);
      setSearchResults([]);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
      <div style={{ flex: 2 }}>
        <SearchInputPreview onSearch={handleSearch} />
        <SearchResults
          results={searchResults}
          onSelect={(company) => setSelectedCompany(company)}
        />
      </div>
      <div style={{ flex: 1 }}>
        {selectedCompany ? (
          <CorporateProfile company={selectedCompany} />
        ) : (
          <p style={{ color: '#6B7280' }}>Select a company to view its profile</p>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import SearchResults from './SearchResults';
import RightPanel from './RightPanel';

export default function SearchClient() {
  const [results, setResults] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null); // <-- NEW

  const handleSearch = async (domain) => {
    setSelectedCompany(null); // Reset when new search starts

    const response = await fetch(`/api/search-contacts?domain=${domain}`);
    const data = await response.json();

    if (data?.results) {
      setResults(data.results);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* LEFT SIDE – Results */}
      <div style={{ flex: 2 }}>
        <SearchResults 
          results={results} 
          onSelectCompany={(company) => setSelectedCompany(company)} 
        />
      </div>

      {/* RIGHT SIDE – Corporate Profile */}
      <div style={{ flex: 1 }}>
        <RightPanel company={selectedCompany} />
      </div>
    </div>
  );
}

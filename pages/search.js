// pages/search.js
import { useState } from 'react';
import CorporateProfile from '../components/CorporateProfile';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchedDomain, setSearchedDomain] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    // Example: fake search results for now
    // Replace this with your real search API call
    setResults([
      { name: 'John Doe', email: `john@${query}` },
      { name: 'Jane Smith', email: `jane@${query}` },
    ]);

    setSearchedDomain(query);
  };

  return (
    <div className="search-page">
      <div className="results">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Enter domain..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <ul className="result-list">
          {results.map((r, idx) => (
            <li key={idx}>
              <strong>{r.name}</strong> - {r.email}
            </li>
          ))}
        </ul>
      </div>

      {/* Corporate Profile Panel */}
      <CorporateProfile domain={searchedDomain} />

      <style jsx>{`
        .search-page {
          display: flex;
          gap: 20px;
          padding: 20px;
        }
        .results {
          flex: 1;
        }
        .search-form {
          margin-bottom: 20px;
        }
        .search-input {
          padding: 10px;
          font-size: 1rem;
          width: 300px;
          border-radius: 6px;
          border: 1px solid #ccc;
          margin-right: 10px;
        }
        .search-button {
          padding: 10px 15px;
          font-size: 1rem;
          border-radius: 6px;
          background: #4f46e5;
          color: white;
          border: none;
          cursor: pointer;
        }
        .result-list {
          list-style: none;
          padding: 0;
        }
        .result-list li {
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}

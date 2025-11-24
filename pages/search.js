// pages/search.js
import { useState } from 'react';
import CorporateProfile from '../components/CorporateProfile';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);

  const handleSearch = async () => {
    if (!query) return;

    // Mock email search results
    const emailResults = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
    ];
    setResults(emailResults);

    // Mock company info
    const companies = {
      'coca-cola.com': {
        name: 'Coca-Cola',
        description: 'Coca-Cola is a global beverage company known for its sparkling soft drinks and refreshing beverages.',
        logo: 'https://1000logos.net/wp-content/uploads/2017/05/Coca-Cola-Logo.png',
        founded: '1886',
        industry: 'Beverages',
        website: 'https://www.coca-cola.com',
      },
      'apple.com': {
        name: 'Apple',
        description: 'Apple Inc. designs, manufactures, and markets consumer electronics, software, and services.',
        logo: 'https://1000logos.net/wp-content/uploads/2016/10/Apple-Logo.png',
        founded: '1976',
        industry: 'Technology',
        website: 'https://www.apple.com',
      },
      // Add more companies as needed
    };

    setCompanyInfo(companies[query.toLowerCase()] || null);
  };

  return (
    <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
      <main style={{ flex: 1 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter domain to search"
          style={{ padding: '8px', width: '100%', marginBottom: '12px' }}
        />
        <button onClick={handleSearch} style={{ padding: '8px 16px', marginBottom: '20px' }}>Search</button>

        <div>
          {results.map((r, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              {r.name}: {r.email}
            </div>
          ))}
        </div>
      </main>

      {/* Right-hand Corporate Profile panel always exists */}
      <aside style={{ width: '300px', minHeight: '400px' }}>
        <CorporateProfile company={companyInfo} />
      </aside>
    </div>
  );
}

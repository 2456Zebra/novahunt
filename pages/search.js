// pages/search.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CorporateProfile from '../components/CorporateProfile';

export default function SearchPage() {
  const router = useRouter();
  const { domain } = router.query; // get domain from query params
  const [query, setQuery] = useState(domain || '');
  const [results, setResults] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    if (domain) handleSearch(domain);
  }, [domain]);

  const handleSearch = async (searchDomain) => {
    const targetDomain = searchDomain || query;
    if (!targetDomain) return;

    // --- Mock search results (replace with real backend call) ---
    const emailResults = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
    ];
    setResults(emailResults);

    // --- Mock corporate profile (replace with API call if needed) ---
    if (targetDomain.includes('coca-cola.com')) {
      setCompanyInfo({
        name: 'Coca-Cola',
        description:
          'Coca-Cola is a global beverage company known for its sparkling soft drinks and refreshing beverages.',
        logo: 'https://1000logos.net/wp-content/uploads/2017/05/Coca-Cola-Logo.png',
        founded: '1886',
        industry: 'Beverages',
        website: 'https://www.coca-cola.com',
      });
    } else {
      setCompanyInfo(null);
    }

    // --- Stub: deduct from account search/reveal totals here if needed ---
    // deductSearchForAccount();
  };

  return (
    <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
      <main style={{ flex: 1 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter company domain"
          style={{ padding: '8px', width: '100%', marginBottom: '12px' }}
        />
        <button
          onClick={() => handleSearch()}
          style={{ padding: '8px 16px', marginBottom: '20px' }}
        >
          Search
        </button>

        <div>
          {results.map((r, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              {r.name}: {r.email}
            </div>
          ))}
        </div>
      </main>

      {/* Corporate Profile panel */}
      {companyInfo && <CorporateProfile company={companyInfo} />}
    </div>
  );
}

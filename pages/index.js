import { useState } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!domain) return;
    router.push(`/search?domain=${encodeURIComponent(domain)}`);
  };

  return (
    <div>
      <header>
        {/* Keep your current header here */}
      </header>

      <main style={{ padding: '24px' }}>
        <h1>Find business contacts from a domain</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            placeholder="Enter domain, e.g. coca-cola.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{ flex: 1, padding: '10px' }}
          />
          <button type="submit" style={{ padding: '8px 12px' }}>Search</button>
        </form>
      </main>
    </div>
  );
}

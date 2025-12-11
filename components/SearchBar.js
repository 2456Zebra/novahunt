import { useState, useEffect } from 'react';

/*
SearchBar
- Replaces the homepage search form. Robustly handles Enter and Search button.
- Prefills from ?domain= query param.
- Usage: import and render on your homepage where the domain input/button were.
*/
export default function SearchBar({ initial = '' }) {
  const [domain, setDomain] = useState(initial);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initial && typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('domain') || '';
      if (p) setDomain(p);
    }
  }, [initial]);

  const submit = () => {
    setError('');
    const trimmed = (domain || '').toString().trim();
    if (!trimmed) {
      setError('Please enter a domain.');
      return;
    }
    // Navigate to homepage with domain param so existing server-side handlers work
    const href = `/?domain=${encodeURIComponent(trimmed)}`;
    window.location.href = href;
  };

  const onKey = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        aria-label="Search domain"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        onKeyDown={onKey}
        placeholder="Enter company domain (e.g. coca-cola.com)"
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #e6e6e6',
          minWidth: 260,
          outline: 'none',
        }}
      />
      <button
        onClick={submit}
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          background: '#0b74ff',
          color: '#fff',
          border: 'none',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Search
      </button>
      {error && <div style={{ color: 'crimson', marginLeft: 8 }}>{error}</div>}
    </div>
  );
}

import { useEffect, useState } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function doSearch(q) {
    setError('');
    setLoading(true);
    try {
      // example: POST to /api/search with { q }
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || 'Search failed');
        setResults([]);
        setLoading(false);
        return;
      }

      // Some APIs return { results: [...] } or similar — normalize here
      const hits = body?.results ?? body ?? [];
      setResults(Array.isArray(hits) ? hits : []);
      setLoading(false);
    } catch (err) {
      setError('Network error while searching');
      setResults([]);
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!query || query.trim().length === 0) return;
    doSearch(query.trim());
  }

  return (
    <main className="container">
      <h1>Search</h1>
      <form onSubmit={onSubmit}>
        <input
          placeholder="Enter domain or query (e.g. coca-cola.com)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {results === null ? (
        <div className="hint">Enter a search and press Search</div>
      ) : results.length === 0 ? (
        <div className="no-results">No results found.</div>
      ) : (
        <ul className="results-list">
          {results.map((r, i) => (
            <li key={r.id ?? i}>
              <a href={r.url ?? '#'} target="_blank" rel="noopener noreferrer">
                {r.title ?? r.url ?? 'Result'}
              </a>
              {r.snippet && <p>{r.snippet}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

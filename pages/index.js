const handleSearch = async (e) => {
  e.preventDefault();
  if (!domain.trim()) return;

  setLoading(true);
  setResults([]);
  setTotal(0);

  try {
    const res = await fetch('/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domain.trim() }),
      cache: 'no-store'
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'API failed');

    // CRITICAL: PRO SHOWS ALL
    const displayResults = isPro ? data.results : data.results.slice(0, 5);
    setResults(displayResults);
    setTotal(data.total || 0);
  } catch (err) {
    console.error('Search error:', err);
    alert('Search failed: ' + err.message);
  } finally {
    setLoading(false);
  }
};

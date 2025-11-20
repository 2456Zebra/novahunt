// --- excerpt: replace or integrate into your existing SearchClient component ---
// Add this inside handleSearch() when mode === 'ai':
if (mode === 'ai') {
  // discover mode: call our lightweight LLM endpoint which returns company names/domains
  const resp = await fetch(`/api/discover-leads?q=${encodeURIComponent(q)}&limit=10`);
  const body = await resp.json();
  if (!resp.ok || !body.ok) {
    // show friendly message and a link to Plans if disabled
    if (body && body.error && body.error.includes('Discover disabled')) {
      setError('Discover is currently disabled. See Plans to enable the AI feature.');
    } else {
      setError(body?.error || 'Discover failed');
    }
    setLoading(false);
    return;
  }
  // body.results -> [{name, domain}]
  // show results as company list; user can click "Get Leads" per company (calls /api/find-emails)
  const items = (body.results || []).map((c, i) => ({ id: `c-${i}`, company: c.name, domain: c.domain }));
  setResults(items);
  setTotalCount(items.length);
  // persist nothing to usage here; Find-Leads will call Hunter (and increment searches if authenticated)
  setLoading(false);
  return;
}

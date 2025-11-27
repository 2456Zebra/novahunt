/* Only the critical parts are shown here; if you already have the page from earlier,
   replace the loadDomain function with this version which calls /api/find-company and uses the normalized response. */

async function loadDomain(d) {
  if (!d) return;
  const key = (d || '').trim().toLowerCase().replace(/^https?:\/\//,'').split('/')[0];
  setDomain(key);

  try {
    const r = await fetch(`/api/find-company?domain=${encodeURIComponent(key)}`);
    if (!r.ok) {
      // handle error gracefully
      setData(null);
      return;
    }
    const payload = await r.json();
    // payload: { domain, company, contacts }
    // company is normalized: name, domain, logo, description, headquarters, ticker, sector, industry, metrics
    const normalized = {
      ...payload.company,
      contacts: payload.contacts || payload.contacts || payload.contacts // defensive
    };
    setData(normalized);
  } catch (err) {
    console.error('find-company fetch failed', err);
    setData(null);
  }

  // update URL without reload
  if (typeof window !== 'undefined') {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('domain', key);
      window.history.replaceState({}, '', u.toString());
    } catch {
      try {
        const base = window.location.pathname || '/';
        const qs = '?domain=' + encodeURIComponent(key);
        window.history.replaceState({}, '', base + qs);
      } catch {}
    }
  }
}

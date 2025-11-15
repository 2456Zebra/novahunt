import React, { useEffect, useState } from 'react';

export default function AccountPage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchUsage() {
      setLoading(true);
      try {
        const sessionValue = typeof window !== 'undefined' ? localStorage.getItem('nh_session') || '' : '';
        const res = await fetch('/api/account-usage', {
          headers: { 'x-nh-session': sessionValue }
        });
        const body = await res.json();
        if (res.ok) setUsage(body);
      } catch (err) {
        console.error('account fetch', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Account</h1>
      {loading && <div>Loading…</div>}
      {!loading && !usage && <div>No account data found.</div>}
      {!loading && usage && (
        <>
          <div style={{ marginBottom: 12 }}>
            <strong>{usage.email}</strong>
          </div>
          <div style={{ marginBottom: 12 }}>
            Plan: <strong>{usage.plan}</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Searches</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{usage.used.searches}/{usage.limits.searches}</div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Reveals</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{usage.used.reveals}/{usage.limits.reveals}</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button onClick={() => window.location.href = '/'} style={{ padding: '8px 10px' }}>Back to dashboard</button>
            <button onClick={async () => {
              try {
                const sessionValue = localStorage.getItem('nh_session') || '';
                const res = await fetch('/api/create-portal-session', { method: 'POST', headers: { 'x-nh-session': sessionValue } });
                const body = await res.json();
                if (res.ok && body.url) window.location.href = body.url;
                else alert('Could not open billing portal: ' + (body?.error || 'unknown'));
              } catch (err) {
                console.error(err);
                alert('Could not open billing portal.');
              }
            }} style={{ marginLeft: 8, padding: '8px 10px' }}>Manage billing</button>
          </div>
        </>
      )}
    </main>
  );
}

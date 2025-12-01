import { useEffect, useState } from 'react';

/*
Account page
- Reads nh_user_email and nh_usage from localStorage and renders editable fields for Searches and Reveals usage/limits.
- On Save updates localStorage and attempts POST to /api/update-usage (best-effort).
*/
export default function AccountPage() {
  const [email, setEmail] = useState('');
  const [usage, setUsage] = useState({ searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const e = localStorage.getItem('nh_user_email') || '';
      const uRaw = localStorage.getItem('nh_usage');
      const u = uRaw ? JSON.parse(uRaw) : null;
      setEmail(e);
      if (u) setUsage(u);
    } catch (err) {
      // ignore
    }
  }, []);

  const handleChange = (field, value) => {
    setUsage((prev) => ({ ...prev, [field]: Number.isFinite(Number(value)) ? Number(value) : value }));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const newUsage = { ...usage };
      localStorage.setItem('nh_usage', JSON.stringify(newUsage));

      // Try to POST to server API if implemented
      try {
        const res = await fetch('/api/update-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, usage: newUsage }),
        });
        if (res.ok) {
          setMessage('Saved.');
        } else {
          setMessage('Saved locally.');
        }
      } catch (err) {
        setMessage('Saved locally.');
      }
    } catch (err) {
      setMessage('Save failed.');
    } finally {
      setSaving(false);
      // Notify other tabs/components via a small localStorage trigger
      try {
        localStorage.setItem('nh_usage_last_update', Date.now().toString());
      } catch (e) {}
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Account</h1>
      <p style={{ color: '#666' }}>Signed in as: <strong>{email || '—'}</strong></p>

      <section style={{ marginTop: 18, padding: 16, borderRadius: 8, border: '1px solid #eee', background: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>Usage & Limits</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Searches used
            <input
              type="number"
              value={usage.searches || 0}
              onChange={(e) => handleChange('searches', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6' }}
            />
          </label>

          <label>
            Searches limit
            <input
              type="number"
              value={usage.limitSearches || 0}
              onChange={(e) => handleChange('limitSearches', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6' }}
            />
          </label>

          <label>
            Reveals used
            <input
              type="number"
              value={usage.reveals || 0}
              onChange={(e) => handleChange('reveals', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6' }}
            />
          </label>

          <label>
            Reveals limit
            <input
              type="number"
              value={usage.limitReveals || 0}
              onChange={(e) => handleChange('limitReveals', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginTop: 6, borderRadius: 6, border: '1px solid #e6e6e6' }}
            />
          </label>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#0b74ff',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          <button
            onClick={() => { localStorage.removeItem('nh_user_email'); localStorage.removeItem('nh_usage'); window.location.href = '/signin'; }}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #e6e6e6',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            Sign out
          </button>

          <div style={{ alignSelf: 'center', color: '#333', fontWeight: 600 }}>{message}</div>
        </div>
      </section>
    </main>
  );
}

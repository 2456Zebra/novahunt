'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// Small usage widget you can include in the header or account area.
// Fetches /api/account-usage and shows progress for searches and reveals.
export default function UsageWidget() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsage() {
      setLoading(true);
      setError(null);
      try {
        const sessionValue = localStorage.getItem('nh_session') || '';
        const res = await fetch('/api/account-usage', {
          headers: { 'x-nh-session': sessionValue }
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body?.error || 'Could not load usage');
        } else {
          setUsage(body);
        }
      } catch (err) {
        setError(err?.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
    // optionally set interval to refresh usage every N seconds
  }, []);

  if (loading) return <div style={{ padding: 8 }}>Loading usage…</div>;
  if (error) return <div style={{ padding: 8, color: '#ef4444' }}>{error}</div>;
  if (!usage) return null;

  const { used, limits, plan } = usage;
  const searchPct = Math.min(100, Math.round((used.searches / limits.searches) * 100));
  const revealPct = Math.min(100, Math.round((used.reveals / limits.reveals) * 100));

  return (
    <div style={{ padding: 8, border: '1px solid #eee', borderRadius: 8, maxWidth: 360 }}>
      <div style={{ fontSize: 13, marginBottom: 6 }}>
        Plan: <strong>{plan}</strong> — Searches: {used.searches}/{limits.searches} — Reveals: {used.reveals}/{limits.reveals}
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: '#6b7280' }}>Searches</div>
        <div style={{ background: '#e5e7eb', height: 8, borderRadius: 6 }}>
          <div style={{ width: `${searchPct}%`, height: '100%', background: '#10b981', borderRadius: 6 }} />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>Reveals</div>
        <div style={{ background: '#e5e7eb', height: 8, borderRadius: 6 }}>
          <div style={{ width: `${revealPct}%`, height: '100%', background: '#f59e0b', borderRadius: 6 }} />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <Link href="/upgrade" style={{ color: '#2563eb', fontSize: 13 }}>Upgrade to add more</Link>
      </div>
    </div>
  );
}

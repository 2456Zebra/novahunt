'use client';

import React, { useEffect, useState, useRef } from 'react';
import UsageWidget from './UsageWidget';

/**
 * Small popover showing account email, plan, usage, and actions.
 * Place a clickable email/name in the header that toggles this popover.
 */
export default function AccountPopover({ email }) {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    async function fetchUsage() {
      setLoading(true);
      try {
        const sessionValue = localStorage.getItem('nh_session') || '';
        const res = await fetch('/api/account-usage', { headers: { 'x-nh-session': sessionValue } });
        const body = await res.json();
        if (res.ok) setUsage(body);
      } catch (err) {
        console.error('account popover usage fetch', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, [open]);

  async function handleManage() {
    try {
      // include current nh_session in headers so server can identify the user
      const sessionValue = localStorage.getItem('nh_session') || '';
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'x-nh-session': sessionValue },
      });
      const body = await res.json();
      if (res.ok && body.url) {
        window.location.href = body.url;
      } else {
        alert('Could not open billing portal: ' + (body?.error || 'unknown'));
      }
    } catch (err) {
      console.error(err);
      alert('Could not open billing portal');
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={rootRef}>
      <button
        onClick={() => setOpen((s) => !s)}
        style={{ background: 'transparent', border: 'none', color: '#0f172a', cursor: 'pointer', textDecoration: 'underline' }}
      >
        {email}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 8,
          width: 340,
          background: 'white',
          border: '1px solid #e6e7ea',
          borderRadius: 8,
          boxShadow: '0 6px 24px rgba(16,24,40,0.08)',
          padding: 12,
          zIndex: 9999
        }}>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>{email}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              {loading ? 'Loading account…' : (usage ? `Plan: ${usage.plan}` : 'Plan: free')}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <UsageWidget />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => { window.location.href = '/'; }} style={{ flex: 1, padding: '8px 10px' }}>
              Account
            </button>
            <button onClick={handleManage} style={{ flex: 1, padding: '8px 10px', background: '#0f172a', color: 'white', borderRadius: 6 }}>
              Manage billing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

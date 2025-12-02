import React, { useEffect, useState } from 'react';
import Router from 'next/router';

/**
 * LimitModal
 *
 * Listens for custom event 'nh_limit_reached' with payload { type: 'reveal'|'search', message?: string }
 * Example: window.dispatchEvent(new CustomEvent('nh_limit_reached', { detail: { type: 'reveal' } }))
 *
 * Renders a simple modal prompting the user to upgrade, with a button to /plans.
 */
export default function LimitModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    function onLimit(ev) {
      const d = ev && ev.detail ? ev.detail : {};
      setType(d.type || 'reveal');
      setMessage(d.message || '');
      setOpen(true);
    }
    window.addEventListener('nh_limit_reached', onLimit);
    return () => window.removeEventListener('nh_limit_reached', onLimit);
  }, []);

  if (!open) return null;

  const title = type === 'search' ? 'Search limit reached' : 'Reveal limit reached';
  const body = message ||
    (type === 'search'
      ? 'You have reached your plan\'s search limit. Upgrade to perform more searches.'
      : 'You have reached your plan\'s reveal limit. Upgrade to reveal more emails.');

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200
    }}>
      <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', width: 'min(680px, 96%)', background: '#fff', borderRadius: 10, padding: 20, zIndex: 2201 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ marginTop: 12, color: '#333' }}>
          <p style={{ marginTop: 0 }}>{body}</p>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setOpen(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { Router.push('/plans'); }} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>
            View plans
          </button>
        </div>
      </div>
    </div>
  );
}

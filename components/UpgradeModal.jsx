// components/UpgradeModal.jsx
// Shows upgrade options when user is out of reveals/searches
// Provides link to plans page or Stripe checkout

import React, { useState } from 'react';
import Router from 'next/router';

export default function UpgradeModal({ open, onClose, reason }) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleUpgrade() {
    setLoading(true);
    try {
      // Navigate to plans page for upgrade
      Router.push('/plans');
      if (typeof onClose === 'function') onClose();
    } catch (e) {
      setLoading(false);
    }
  }

  const reasonText = reason === 'reveals'
    ? "You've used all your reveals for this period."
    : reason === 'searches'
    ? "You've used all your searches for this period."
    : "You've reached your usage limit.";

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label="Upgrade plan"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(440px, 94%)',
          maxWidth: 440,
          background: '#fff',
          borderRadius: 12,
          padding: 28,
          boxShadow: '0 14px 50px rgba(0,0,0,0.2)',
          zIndex: 1401,
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: '0 0 12px 0', fontSize: 22 }}>Upgrade Your Plan</h2>
        <p style={{ color: '#4b5563', marginBottom: 20, fontSize: 15 }}>
          {reasonText}
        </p>

        <ul style={{ textAlign: 'left', paddingLeft: 24, marginBottom: 24, color: '#374151' }}>
          <li style={{ marginBottom: 8 }}>More reveals & searches</li>
          <li style={{ marginBottom: 8 }}>Real-time verification</li>
          <li style={{ marginBottom: 8 }}>Export to CSV</li>
          <li>Priority support</li>
        </ul>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: '#10b981',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 12,
          }}
        >
          {loading ? 'Redirecting…' : 'View Plans'}
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

// components/RevealResultModal.jsx
// Shows the result of a reveal action (success with data, or error)
// Dispatched globally via window event 'nh_show_reveal_result'

import React from 'react';

export default function RevealResultModal({ open, data, error, onClose }) {
  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label="Reveal result"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(500px, 94%)',
          maxWidth: 500,
          background: '#fff',
          borderRadius: 10,
          padding: 24,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          zIndex: 1301,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{error ? 'Reveal Failed' : 'Reveal Result'}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}
          >
            ×
          </button>
        </header>

        {error && (
          <div style={{ color: '#dc2626', marginBottom: 16 }}>
            {typeof error === 'string' ? error : 'An error occurred during the reveal.'}
          </div>
        )}

        {!error && data && (
          <div style={{ marginBottom: 16 }}>
            {data.email && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Email</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{data.email}</div>
              </div>
            )}
            {data.phone && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Phone</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{data.phone}</div>
              </div>
            )}
            {data.linkedin && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>LinkedIn</div>
                <a href={data.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', fontWeight: 600 }}>
                  {data.linkedin}
                </a>
              </div>
            )}
            {data.note && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>Note</div>
                <div>{data.note}</div>
              </div>
            )}
            {!data.email && !data.phone && !data.linkedin && !data.note && (
              <div style={{ color: '#6b7280' }}>No additional information returned.</div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              background: '#111827',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

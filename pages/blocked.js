// pages/blocked.js
import React from 'react';

export default function Blocked() {
  const currentProd = process.env.NEXT_PUBLIC_CURRENT_PROD_URL;

  const goHome = () => {
    // Hard redirect to current production
    if (currentProd) {
      window.location.replace(currentProd);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        color: '#b91c1c',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Access Blocked</h1>
      <p style={{ marginBottom: '2rem' }}>
        You are not allowed to view this site.
      </p>
      <button
        onClick={goHome}
        style={{
          backgroundColor: '#b91c1c',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '500',
        }}
      >
        Go Home
      </button>
    </div>
  );
}

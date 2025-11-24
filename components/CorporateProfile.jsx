// components/CorporateProfile.jsx
import React from 'react';

export default function CorporateProfile({ company }) {
  if (!company) return null;

  const { name, description, logo, founded, industry, website } = company;

  return (
    <aside
      style={{
        width: '320px',
        padding: '20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #d9e4ff 100%)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
        fontFamily: 'Inter, sans-serif',
        flexShrink: 0,
      }}
    >
      {logo && (
        <img
          src={logo}
          alt={name}
          style={{ width: '100%', borderRadius: '8px', marginBottom: '12px' }}
        />
      )}
      <h2 style={{ marginBottom: '8px', fontSize: '1.5rem', color: '#1e3a8a' }}>
        {name}
      </h2>
      <p style={{ fontSize: '0.95rem', marginBottom: '12px', color: '#1f2937' }}>
        {description}
      </p>
      <ul style={{ fontSize: '0.9rem', color: '#374151', paddingLeft: '16px' }}>
        {founded && (
          <li>
            <strong>Founded:</strong> {founded}
          </li>
        )}
        {industry && (
          <li>
            <strong>Industry:</strong> {industry}
          </li>
        )}
        {website && (
          <li>
            <strong>Website:</strong>{' '}
            <a href={website} target="_blank" rel="noopener noreferrer">
              {website}
            </a>
          </li>
        )}
      </ul>
    </aside>
  );
}

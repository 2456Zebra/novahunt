import React from 'react';
import RevealButton from './RevealButton';

/**
 * ResultItem — small, re-usable UI for each search hit.
 * - shows item.name, department/title
 * - shows email OR maskedEmail (maskedEmail preferred when present)
 * - includes RevealButton
 */
export default function ResultItem({ item = {}, isSignedIn = false }) {
  const emailDisplay = item.email || item.maskedEmail || '—';
  const department = item.department || item.title || '';

  return (
    <div style={{ padding: 12, borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{item.name || (item.email || '')}</div>
        {department ? <div style={{ color: '#6b7280', fontSize: 13 }}>{department}</div> : null}
        <div style={{ color: '#111', marginTop: 6 }}>{emailDisplay}</div>
      </div>

      <div>
        <RevealButton to={isSignedIn ? '#' : '/plans?source=search'} className="reveal-btn">
          Reveal
        </RevealButton>
      </div>
    </div>
  );
}

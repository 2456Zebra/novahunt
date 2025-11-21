import React from 'react';
import RevealButton from './RevealButton';

/**
 * ResultItem — renders name, title/department, email (masked or real),
 * and shows the source and Reveal button.
 */
export default function ResultItem({ item = {}, isSignedIn = false }) {
  const emailDisplay = item.email || item.maskedEmail || '—';
  const department = item.department || item.title || '';
  const title = item.title || '';
  const source = item.source || '';

  return (
    <div style={{ padding: 12, borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
          <div style={{ fontWeight: 700 }}>{item.name || (item.email || emailDisplay)}</div>
          {department ? <div style={{ color: '#6b7280', fontSize: 13 }}>{department}</div> : null}
        </div>

        {title ? <div style={{ color: '#374151', marginTop: 6 }}>{title}</div> : null}

        <div style={{ marginTop: 8, color: '#111' }}>{emailDisplay}</div>

        {source ? (
          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            Source:{' '}
            <a href={source} target="_blank" rel="noreferrer noopener" style={{ color: '#2563eb' }}>
              {source.replace(/^https?:\/\//, '').slice(0, 80)}
            </a>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <RevealButton to={isSignedIn ? '#' : '/plans?source=search'} className="reveal-btn">
          Reveal
        </RevealButton>
      </div>
    </div>
  );
}

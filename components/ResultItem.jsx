import React from 'react';
import RevealButton from './RevealButton';

/**
 * ResultItem — renders name, department/title, trust percentage, email (masked or real),
 * clickable 'Source' text, and Reveal button.
 */
export default function ResultItem({ item = {}, isSignedIn = false }) {
  // item.confidence may be 0-1 or 0-100 depending on upstream; normalize to 0-100 %
  const rawConfidence = (typeof item.confidence === 'number') ? item.confidence : (typeof item.score === 'number' ? item.score : 0);
  const confidencePct = rawConfidence > 1 ? Math.round(rawConfidence) : Math.round(rawConfidence * 100);

  const emailDisplay = item.email || item.maskedEmail || '—';
  const title = item.title || '';
  const source = item.source || '';
  const department = item.department || '';

  return (
    <div style={{ padding: 12, borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
          <div style={{ fontWeight: 700 }}>{item.name || (item.email || emailDisplay)}</div>

          {/* Trust badge */}
          <div style={{ background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>
            {confidencePct}% trust
          </div>
        </div>

        {department ? <div style={{ marginTop: 6, color: '#6b7280', fontSize: 13 }}>{title ? `${title}` : ''}</div> : (title ? <div style={{ marginTop: 6, color: '#6b7280', fontSize: 13 }}>{title}</div> : null)}

        <div style={{ marginTop: 8, color: '#111', wordBreak: 'break-word' }}>{emailDisplay}</div>

        {source ? (
          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            Source:{' '}
            <a href={source} target="_blank" rel="noreferrer noopener" style={{ color: '#2563eb' }}>
              Source
            </a>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <RevealButton to={isSignedIn ? '#' : '/plans?source=search'} className="reveal-btn">
          Reveal
        </RevealButton>
      </div>
    </div>
  );
}

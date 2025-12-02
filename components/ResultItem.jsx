import React from 'react';
import RevealButton from './RevealButton';

/*
  ResultItem - small presentational component for a contact row.

  Expects item shape from /api/find-emails:
    {
      name, title, department, confidence, source,
      maskedEmail, email, canReveal, revealUrl
    }

  Behavior:
  - Show maskedEmail (or email as fallback).
  - Uses RevealButton for in-place reveal for signed-in users within quota.
  - Hides direct mailto unless the item has an unmasked email and reveal was used (server gating).
*/

export default function ResultItem({ item, onReveal }) {
  const displayEmail = item?.maskedEmail || item?.email || '';

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontWeight: 600 }}>{item?.name || item?.email}</div>
        <div style={{ color: '#6B7280', fontSize: 13 }}>
          {item?.title || item?.role || ''}
          {item?.company ? ` • ${item.company}` : ''}
        </div>

        <div style={{ marginTop: 8 }}>
          <span style={{ color: '#111827', fontFamily: 'monospace' }}>{displayEmail}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>
          {item?.confidence ? `${Math.round(item.confidence * 100)}% trust` : null}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <RevealButton
            target={item?.id || item?.email || 'unknown'}
            onSuccess={onReveal}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              background: '#F9FAFB',
              color: '#111827',
              textDecoration: 'none',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Reveal
          </RevealButton>

          <a
            href={item?.source || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#111827',
              textDecoration: 'none',
              fontSize: 13,
            }}
          >
            Source
          </a>
        </div>
      </div>
    </div>
  );
}

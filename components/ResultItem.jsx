// components/ResultItem.jsx
import React, { useState } from 'react';

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 3) return `${local[0]}***@${domain}`;
  const keep = Math.min(3, Math.max(1, Math.floor(local.length / 2)));
  const masked = local[0] + '*'.repeat(Math.max(0, local.length - keep - 1)) + local.slice(-keep);
  return `${masked}@${domain}`;
}

export default function ResultItem({ contact = {} }) {
  const [revealed, setRevealed] = useState(false);
  const { name, title, email, trust, source } = contact;

  return (
    <div className="nh-card nh-result-item" role="listitem">
      <div className="nh-avatar" aria-hidden>{name?.[0] || '?'}</div>

      <div className="nh-result-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="nh-name">{name || 'Unknown'}</div>
          <div className="nh-trust">{trust ? `${trust}% trust` : '—'}</div>
        </div>

        <div className="nh-title">{title || ''}</div>

        <div className="nh-email-row">
          <div className="nh-email">{revealed ? email : maskEmail(email || '')}</div>

          <div className="nh-actions">
            <button className="nh-btn nh-btn-outline" onClick={() => setRevealed(!revealed)}>
              {revealed ? 'Hide' : 'Reveal'}
            </button>
            <span className="nh-badge">{source || 'public'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

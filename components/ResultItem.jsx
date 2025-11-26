import React, { useState } from 'react';

export default function ResultItem({ contact = {} }) {
  const [revealed, setRevealed] = useState(false);

  const maskEmail = (email) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [local, domain] = parts;
    if (local.length <= 3) return `${local[0]}***@${domain}`;
    const keep = Math.min(3, Math.max(1, Math.floor(local.length / 2)));
    const masked = local[0] + '*'.repeat(Math.max(0, local.length - keep - 1)) + local.slice(-keep);
    return `${masked}@${domain}`;
  };

  return (
    <div className="nh-card nh-result-item" role="listitem">
      <div className="nh-avatar" aria-hidden>{contact.avatar || contact.name?.[0] || '?'}</div>

      <div className="nh-result-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="nh-name">{contact.name || 'Unknown'}</div>
          <div className="nh-trust" aria-label={`${contact.trust || '—'} percent trust`}>{contact.trust ? `${contact.trust}% trust` : '—'}</div>
        </div>

        <div className="nh-title">{contact.title || ''}</div>

        <div className="nh-email-row">
          <div className="nh-email" aria-live="polite">
            {revealed ? (contact.email || 'n/a') : maskEmail(contact.email || '')}
          </div>

          <div className="nh-actions">
            <button
              className="nh-btn nh-btn-accent"
              onClick={() => setRevealed(!revealed)}
              aria-pressed={revealed}
            >
              {revealed ? 'Hide' : 'Reveal'}
            </button>
            <span className="nh-badge" aria-hidden>{contact.source || 'public'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

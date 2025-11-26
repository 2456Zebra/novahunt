import React, { useState } from 'react';
import './../styles/theme.css';

export default function ResultItem({ contact }) {
  const [revealed, setRevealed] = useState(false);

  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!local) return email;
    const keep = Math.min(3, Math.max(1, Math.floor(local.length / 2)));
    const masked = local[0] + '*'.repeat(Math.max(0, local.length - keep - 1)) + local.slice(-keep);
    return `${masked}@${domain}`;
  };

  return (
    <div className="nh-card nh-result-item" role="listitem">
      <div className="nh-avatar">{contact.avatar || contact.name?.[0] || '?'}</div>

      <div className="nh-result-main">
        <div className="nh-result-header">
          <div className="nh-name">{contact.name}</div>
          <div className="nh-trust">{contact.trust?.toString() || '—'}% trust</div>
        </div>

        <div className="nh-title">{contact.title}</div>

        <div className="nh-email-row">
          <div className="nh-email">
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
            <span className="nh-badge">{contact.source || 'public'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

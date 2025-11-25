import React, { useState } from 'react';

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  // keep first char and last char before @, mask middle
  const first = local[0];
  const last = local[local.length - 1];
  const masked = first + '***' + last;
  return `${masked}@${domain}`;
}

export default function ResultItem({ item }) {
  // item: { name, role, company, email, trust, ... }
  const [showEmail, setShowEmail] = useState(false);

  const email = item?.email || '';
  const displayEmail = showEmail ? email : maskEmail(email);

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{item.name || item.email}</div>
        <div style={{ color: '#6B7280', fontSize: 13 }}>{item.role || item.title || ''} {item.company && `• ${item.company}`}</div>
        <div style={{ marginTop: 6, color: '#111827' }}>
          <a href={`mailto:${email}`} onClick={(e) => { if (!showEmail) { e.preventDefault(); } }} style={{ color: '#111827', textDecoration: 'none' }}>
            {displayEmail}
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>{item.trust ? `${item.trust}% trust` : null}</div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowEmail((s) => !s)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              background: showEmail ? '#111827' : '#F9FAFB',
              color: showEmail ? '#fff' : '#111827',
              cursor: 'pointer',
            }}
            aria-pressed={showEmail}
          >
            {showEmail ? 'Hide' : 'Reveal'}
          </button>

          <button
            onClick={() => { /* keep existing Source / Reveal actions you have — add code here if needed */ }}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Source
          </button>
        </div>
      </div>
    </div>
  );
}

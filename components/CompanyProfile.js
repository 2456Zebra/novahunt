import React, { useState } from 'react';

function Paragraph({ text }) {
  return <p style={{ margin: '8px 0', color: '#111827', lineHeight: 1.5 }}>{text}</p>;
}

function HeroPhoto({ photos = [], logoSrc, name }) {
  const [index, setIndex] = useState(0);
  const photosToShow = photos.slice(0, 3);
  const active = photosToShow[index];

  if (!active && !logoSrc) {
    return (
      <div style={{ width: '100%', height: 160, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
        <span style={{ color: '#9CA3AF', fontSize: 36 }}>{name ? name[0].toUpperCase() : '?'}</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      <img
        src={active || logoSrc}
        alt={name + ' photo'}
        style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      {photosToShow.length > 1 && (
        <div style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', gap: 6 }}>
          {photosToShow.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`photo ${i + 1}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: i === index ? '#111827' : 'rgba(255,255,255,0.7)',
                border: 'none',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CompanyProfile({ company, domain, onRegenerate }) {
  const [expanded, setExpanded] = useState(false);

  const name = company?.name || domain || 'Company';
  const website = company?.website || (domain ? `https://${domain}` : null);
  const logo = company?.logo || (domain ? `https://logo.clearbit.com/${domain}` : null);
  const photos = Array.isArray(company?.photos) ? company.photos : [];
  const summary = company?.summary || null;
  const description = company?.description || null;

  // playful fallback templates if summary is missing
  const playfulFallbacks = [
    `${name} — think big ideas wrapped in caffeine and curiosity. They make things people love.`,
    `Meet ${name}: a scrappy team solving problems in surprisingly delightful ways.`,
    `${name} is the kind of company that prefers clever solutions and snacks in the break room.`,
  ];
  const fallbackSummary = playfulFallbacks[Math.abs((name && name.length) || 0) % playfulFallbacks.length];

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', background: '#fff', border: '1px solid #E5E7EB' }}>
      <div style={{ padding: 0 }}>
        <HeroPhoto photos={photos} logoSrc={logo} name={name} />
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {logo ? (
            <img
              src={logo}
              alt={`${name} logo`}
              style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: '#F9FAFB' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: 56, height: 56, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
              <span style={{ color: '#9CA3AF', fontSize: 20 }}>{name[0].toUpperCase()}</span>
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>{name}</h3>
            {website && (
              <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontSize: 13 }}>
                {website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Paragraph text={summary || fallbackSummary} />
          {expanded && description && <Paragraph text={description} />}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: expanded ? '#111827' : '#F9FAFB',
              color: expanded ? '#fff' : '#111827',
              cursor: 'pointer',
              flex: 1
            }}
          >
            {expanded ? 'Hide details' : 'Show more'}
          </button>

          <button
            onClick={() => onRegenerate && onRegenerate()}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#111827',
              cursor: 'pointer'
            }}
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}

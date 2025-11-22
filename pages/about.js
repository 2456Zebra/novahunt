import React from 'react';

export default function AboutPage() {
  const who = [
    { title: 'Agencies', img: '/images/who-agencies.png', desc: 'Find decision-makers at brands and publishers to pitch your services.' },
    { title: 'Sales Teams', img: '/images/who-sales.png', desc: 'Locate contacts across target accounts, sorted by role and trust.' },
    { title: 'Recruiters', img: '/images/who-recruiters.png', desc: 'Discover engineering and product leaders for hiring pipelines.' },
    { title: 'Founders', img: '/images/who-founders.png', desc: 'Quickly find C-suite and executive contacts for partnerships.' }
  ];

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
      <h1>About NovaHunt</h1>
      <p style={{ color: '#374151', fontSize: 16 }}>
        NovaHunt helps teams discover business contacts by company domain and organizes results with trust ratings, roles, and sources.
      </p>

      <section style={{ marginTop: 28 }}>
        <h2>Who we help</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 12 }}>
          {who.map((w, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 8, border: '1px solid #eef2f7', background: '#fff' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img src={w.img} alt={w.title} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>{w.title}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{w.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

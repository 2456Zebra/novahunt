import React from 'react';

/**
 * Simple presentational cards to show example use-cases under search results.
 * Replace with real images when available.
 */

export default function Renderings() {
  const cards = [
    { emoji: '👗', title: 'Model → Agency', desc: 'Find modelling agencies and casting contacts to book your next shoot.' },
    { emoji: '🎭', title: 'Actor → Agent', desc: 'Locate talent agents and casting directors for auditions.' },
    { emoji: '📈', title: 'Seller → Leads', desc: 'Discover sales contacts to scale your outreach and win that next contract.' },
  ];

  return (
    <section aria-label="Example use cases" style={{ marginTop: 28 }}>
      <h3 style={{ marginTop: 0 }}>How people use NovaHunt</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ flex: '1 1 220px', padding: 16, border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
            <div style={{ fontSize: 40 }}>{c.emoji}</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>{c.title}</div>
            <div style={{ color: '#6b7280', marginTop: 6 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
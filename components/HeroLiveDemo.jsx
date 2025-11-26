import React, { useState } from 'react';
import ResultsList from './ResultsList';

/**
 * Demo domains & sample contacts:
 * coca-cola.com, fordmodels.com, caa.com, wilhelmina.com, warnerbros.com
 *
 * These are mock/demo data for the homepage demo section.
 */
const DEMO_DATA = {
  'coca-cola.com': [
    { name: 'Anya Fisher', title: 'Senior Director of Corporate Communications', email: 'anya.fisher@coca-cola.com', trust: 99, source: 'public' },
    { name: 'Anna Rodzik', title: 'Media Director', email: 'anna.rodzik@coca-cola.com', trust: 99, source: 'public' },
    { name: 'Felix Poh', title: 'VP, Strategy & Corporate Dev', email: 'felix.poh@coca-cola.com', trust: 99, source: 'public' },
    { name: 'Priscila Martino', title: 'Senior Director of Accounting', email: 'priscila.martino@coca-cola.com', trust: 99, source: 'public' },
  ],
  'fordmodels.com': [
    { name: 'Jamie Hart', title: 'Talent Booker', email: 'jamie.hart@fordmodels.com', trust: 98, source: 'demo' },
    { name: 'Sofia Lee', title: 'Casting Director', email: 'sofia.lee@fordmodels.com', trust: 97, source: 'demo' },
  ],
  'caa.com': [
    { name: 'Marco Diaz', title: 'Talent Agent', email: 'marco.diaz@caa.com', trust: 96, source: 'demo' },
    { name: 'Lisa Park', title: 'Casting Producer', email: 'lisa.park@caa.com', trust: 95, source: 'demo' },
  ],
  'wilhelmina.com': [
    { name: 'Ava Stone', title: 'PR Manager', email: 'ava.stone@wilhelmina.com', trust: 98, source: 'demo' },
    { name: 'Noah Filipe', title: 'Sponsorships Lead', email: 'noah.filipe@wilhelmina.com', trust: 94, source: 'demo' },
  ],
  'warnerbros.com': [
    { name: 'Rita Gomez', title: 'Art Director', email: 'rita.gomez@warnerbros.com', trust: 95, source: 'demo' },
    { name: 'Mark Mitchell', title: 'Director of Cloud Services', email: 'mark.mitchell@warnerbros.com', trust: 95, source: 'demo' },
  ],
};

const DOMAIN_LIST = Object.keys(DEMO_DATA);

export default function HeroLiveDemo({ initial = 'coca-cola.com' }) {
  const [domain, setDomain] = useState(initial);
  const [query, setQuery] = useState(domain);

  const contacts = DEMO_DATA[domain] || [];

  const onSelect = (d) => {
    setDomain(d);
    setQuery(d);
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  return (
    <section className="nh-hero-demo" aria-label="Live demo search">
      <div className="nh-demo-controls" style={{display:'flex', gap:10}}>
        <input
          className="nh-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a company domain (e.g. coca-cola.com)"
          aria-label="demo domain"
        />
        <button
          className="nh-btn nh-btn-outline"
          onClick={() => onSelect(query)}
        >
          Search
        </button>
      </div>

      <div className="nh-domain-carousel" style={{marginTop:12}}>
        {DOMAIN_LIST.map((d) => (
          <button
            key={d}
            className={`nh-chip ${d === domain ? 'nh-chip-active' : ''}`}
            onClick={() => onSelect(d)}
            aria-pressed={d === domain}
            style={{marginBottom:8}}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="nh-demo-results" style={{marginTop:16}}>
        <ResultsList contacts={contacts} />
      </div>

      <div className="nh-demo-cta">
        <p className="nh-small">Try a real search above. Reveal shows the full email in this demo.</p>
      </div>
    </section>
  );
}

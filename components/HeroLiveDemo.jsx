// components/HeroLiveDemo.jsx
import React, { useState, useEffect } from 'react';
import ResultsList from './ResultsList';

/**
 * HeroLiveDemo
 * - initial: initial domain to show
 * - onSelectDomain(domain, company): callback when a domain is chosen
 */
const DEMO_DATA = {
  'coca-cola.com': {
    company: { name: 'Coca-Cola', description: 'Global beverage company' },
    contacts: [
      { name: 'Anya Fisher', title: 'Senior Director, Corp Comms', email: 'anya.fisher@coca-cola.com', trust: 99, source: 'public' },
      { name: 'Anna Rodzik', title: 'Media Director', email: 'anna.rodzik@coca-cola.com', trust: 99, source: 'public' },
    ],
  },
  'fordmodels.com': {
    company: { name: 'Ford Models', description: 'Modeling agency' },
    contacts: [
      { name: 'Jamie Hart', title: 'Talent Booker', email: 'jamie.hart@fordmodels.com', trust: 98, source: 'demo' },
      { name: 'Sofia Lee', title: 'Casting Director', email: 'sofia.lee@fordmodels.com', trust: 97, source: 'demo' },
    ],
  },
  'caa.com': {
    company: { name: 'CAA', description: 'Creative artists agency' },
    contacts: [
      { name: 'Marco Diaz', title: 'Talent Agent', email: 'marco.diaz@caa.com', trust: 96, source: 'demo' },
    ],
  },
  'wilhelmina.com': {
    company: { name: 'Wilhelmina', description: 'Global modeling agency' },
    contacts: [
      { name: 'Ava Stone', title: 'PR Manager', email: 'ava.stone@wilhelmina.com', trust: 98, source: 'demo' },
    ],
  },
  'warnerbros.com': {
    company: { name: 'Warner Bros', description: 'Entertainment company' },
    contacts: [
      { name: 'Rita Gomez', title: 'Art Director', email: 'rita.gomez@warnerbros.com', trust: 95, source: 'demo' },
    ],
  },
};

const DOMAINS = Object.keys(DEMO_DATA);

export default function HeroLiveDemo({ initial = 'coca-cola.com', onSelectDomain }) {
  const [domain, setDomain] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [contacts, setContacts] = useState(DEMO_DATA[initial].contacts || []);

  useEffect(() => {
    // When domain changes, update shown contacts
    setContacts(DEMO_DATA[domain]?.contacts || []);
    if (typeof onSelectDomain === 'function') {
      onSelectDomain(domain, DEMO_DATA[domain]?.company || null);
    }
  }, [domain]);

  const runSearch = (d) => {
    const normalized = (d || '').trim().toLowerCase();
    if (!normalized) return;
    setDomain(normalized);
    setQuery(normalized);
  };

  return (
    <div className="nh-hero-demo">
      <div className="nh-search-row">
        <input
          className="nh-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runSearch(query); }}
          placeholder="Enter domain, e.g. coca-cola.com"
          aria-label="domain"
        />
        <button className="nh-btn nh-btn-accent" onClick={() => runSearch(query)}>Search</button>
      </div>

      <div className="nh-suggestions">
        {DOMAINS.map((d) => (
          <button
            key={d}
            className={`nh-chip ${d === domain ? 'nh-chip-active' : ''}`}
            onClick={() => runSearch(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <h3 className="nh-section-title">Top contacts</h3>
      <ResultsList contacts={contacts} />
    </div>
  );
}

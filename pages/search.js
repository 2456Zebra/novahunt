import { useState } from 'react';
import { performSearch, getAccountState } from '../utils/accountActions';
import RevealButton from '../components/RevealButton';

export default function SearchPage({ initialDomain = '' }) {
  const [domain, setDomain] = useState(initialDomain);
  const [results, setResults] = useState([
    {
      category: 'communication',
      contacts: [
        { name: 'Anya Fisher', role: 'Senior Director of Corporate Communications', email: 'a********r@coca-cola.com', trust: '99%' },
        { name: 'Anna Rodzik', role: 'Media Director', email: 'a*****k@coca-cola.com', trust: '99%' },
      ],
    },
    {
      category: 'executive',
      contacts: [
        { name: 'Felix Poh', role: 'VP Strategy & Corporate Development', email: 'f*******h@coca-cola.com', trust: '99%' },
      ],
    },
  ]);

  const [account, setAccount] = useState(getAccountState());

  const handleSearch = (e) => {
    e.preventDefault();
    if (!domain) return;

    if (!performSearch()) {
      alert('No searches remaining.');
      return;
    }

    setAccount(getAccountState());
  };

  const handleReveal = (categoryIndex, contactIndex) => {
    const updatedResults = [...results];
    updatedResults[categoryIndex].contacts[contactIndex].revealed = true;
    setResults(updatedResults);
    setAccount(getAccountState());
  };

  return (
    <div>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e6e6e6', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#111' }}>
            <span style={{ fontSize: '20px', fontWeight: 800 }}>NovaHunt</span>
          </a>
          <nav style={{ display: 'flex', gap: '12px' }}>
            <a href="/" style={{ color: '#374151', textDecoration: 'none' }}>Home</a>
            <a href="/plans" style={{ color: '#374151', textDecoration: 'none' }}>Plans</a>
            <a href="/about" style={{ color: '#374151', textDecoration: 'none' }}>About</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>Sign in</button>
          <a href="/plans" style={{ padding: '6px 10px', borderRadius: '6px', background: '#111827', color: '#fff', textDecoration: 'none' }}>Sign up</a>
        </div>
      </header>

      <main style={{ padding: '24px' }}>
        <h1 style={{ marginTop: '20px' }}>Find business contacts from a domain</h1>
        <p style={{ color: '#6b7280' }}>Enter a company website (example: coca-cola.com) and NovaHunt will show public business contacts.</p>

        <form style={{ display: 'flex', gap: '8px', marginTop: '20px' }} onSubmit={handleSearch}>
          <input
            placeholder="Enter domain, e.g. coca-cola.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{ flex: '1 1 0%', padding: '10px' }}
          />
          <button type="submit" style={{ padding: '8px 12px' }}>Search</button>
        </form>

        <div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
          Searches remaining: {account.searchesRemaining} | Reveals remaining: {account.revealsRemaining}
        </div>

        {results.map((group, catIndex) => (
          <div key={group.category} style={{ marginTop: '12px' }}>
            <div style={{ display: 'inline-block', background: '#fff3ee', color: '#7a341f', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, marginBottom: '8px' }}>
              {group.category} <span style={{ fontWeight: 500, marginLeft: '8px' }}>({group.contacts.length})</span>
            </div>

            {group.contacts.map((contact, contactIndex) => (
              <div key={contact.email} style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 0%' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                      <div style={{ fontWeight: 700 }}>{contact.name}</div>
                      <div style={{ background: '#f3f4f6', color: '#374151', borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>{contact.trust} trust</div>
                    </div>
                    <div>
                      <RevealButton
                        target={contact.email}
                        onSuccess={() => handleReveal(catIndex, contactIndex)}
                        style={{ display: 'inline-block', padding: '6px 10px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        Reveal
                      </RevealButton>
                    </div>
                  </div>
                  <div style={{ marginTop: '6px', color: '#6b7280', fontSize: '13px' }}>{contact.role}</div>
                  <div style={{ marginTop: '8px', color: '#111', wordBreak: 'break-word' }}>
                    {contact.revealed ? contact.email : contact.email.replace(/.(?=.*@)/g, '*')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>
    </div>
  );
}

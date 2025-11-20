'use client';

import { useEffect, useState } from 'react';
import RevealButton from './RevealButton';
import { getLocalSession } from '../utils/auth';

export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!domain || !domain.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const session = getLocalSession();
      const token = session && session.token ? session.token : '';
      
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nh-session': token || ''
        },
        body: JSON.stringify({ domain: domain.trim() })
      });

      const json = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        setError(json?.error || 'Search failed');
        setResults([]);
      } else {
        setResults(json.results || []);
        
        // Update local usage with server-provided usage if available
        if (json.usage) {
          try {
            localStorage.setItem('nh_usage', JSON.stringify(json.usage));
            window.dispatchEvent(new CustomEvent('account-usage-updated'));
          } catch (e) {}
        }
      }
    } catch (err) {
      setError(String(err?.message || err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Email Search</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter domain (e.g. example.com)"
          style={{
            padding: '8px 12px',
            fontSize: '16px',
            width: '300px',
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px',
            fontSize: '16px',
            background: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', background: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h3>Results ({results.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {results.map((item, idx) => (
              <li key={idx} style={{
                padding: '15px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fafafa'
              }}>
                <div><strong>{item.first_name} {item.last_name}</strong></div>
                <div style={{ color: '#666', fontSize: '14px' }}>{item.position}</div>
                <div style={{ marginTop: '8px' }}>
                  <RevealButton
                    contactId={`email-${idx}`}
                    payload={{ email: item.email }}
                    onRevealed={(revealed) => {
                      console.log('Email revealed:', revealed);
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

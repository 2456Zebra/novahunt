// components/RightPanel.jsx
import React, { useState, useEffect } from 'react';
import CompanyProfile from './CompanyProfile';

/**
 * RightPanel displays the Company Profile and Top Contacts.
 * Uses SearchClient result.company if provided, otherwise fetches from /api/company.
 */
export default function RightPanel({ domain, result }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch company info when domain changes
  useEffect(() => {
    // If result already provides company data, use it
    if (result?.company) {
      setCompany(result.company);
      setLoading(false);
      setError(null);
      return;
    }

    // If no domain, reset state
    if (!domain) {
      setCompany(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Fetch company info from our API
    const fetchCompany = async (regenerate = false) => {
      setLoading(true);
      setError(null);

      try {
        const url = `/api/company?domain=${encodeURIComponent(domain)}${regenerate ? '&regenerate=1' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch company info');
        }

        const data = await response.json();
        setCompany(data.company);
      } catch (err) {
        console.error('RightPanel fetch error:', err);
        setError('Unable to load company profile');
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany(false);
  }, [domain, result?.company]);

  // Handler for regenerate button
  const handleRegenerate = async () => {
    if (!domain) return;
    
    setLoading(true);
    setError(null);

    try {
      const url = `/api/company?domain=${encodeURIComponent(domain)}&regenerate=1`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to regenerate company info');
      }

      const data = await response.json();
      setCompany(data.company);
    } catch (err) {
      console.error('RightPanel regenerate error:', err);
      setError('Unable to regenerate profile');
    } finally {
      setLoading(false);
    }
  };

  // Get contacts from result.items if present
  const contacts = result?.items || [];
  const hasContacts = contacts.length > 0;

  return (
    <aside style={styles.aside}>
      {/* Company Profile Section */}
      <CompanyProfile
        company={company}
        domain={domain}
        onRegenerate={domain ? handleRegenerate : null}
        loading={loading}
      />

      {/* Error message */}
      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Top Contacts Section */}
      {hasContacts && (
        <div style={styles.contactsBox}>
          <h4 style={styles.contactsTitle}>Top Contacts</h4>
          <ul style={styles.contactsList}>
            {contacts.slice(0, 5).map((contact, index) => (
              <li key={index} style={styles.contactItem}>
                <div style={styles.contactName}>
                  {contact.name || 'Unknown'}
                </div>
                {contact.role && (
                  <div style={styles.contactRole}>{contact.role}</div>
                )}
                {contact.email && (
                  <div style={styles.contactEmail}>{contact.email}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

const styles = {
  aside: {
    width: '360px',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '14px',
    margin: 0,
  },
  contactsBox: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
  },
  contactsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 12px 0',
  },
  contactsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  contactItem: {
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  contactName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
  },
  contactRole: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  contactEmail: {
    fontSize: '12px',
    color: '#2563eb',
    marginTop: '4px',
  },
};

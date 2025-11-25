import React, { useState, useEffect } from 'react';

/**
 * CompanyProfile — playful, informal company info panel with photos.
 * Props:
 *  - domain (string) — searched domain
 *  - result (object) — latest search result (optional)
 *  - company (object) — pre-fetched company data (optional, will fetch if not provided)
 *
 * Features:
 * - Displays hero photo or small carousel (up to 3 photos)
 * - Shows company logo (clearbit fallback) and name
 * - Playful, informal conversational summary
 * - Short history paragraph when available
 * - Show more / Hide details toggle
 * - Regenerate button for new summary variations
 * - Graceful handling of missing data
 * - Uses inline styles only
 */

const styles = {
  container: {
    padding: 16,
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #eef2f7',
    boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    objectFit: 'contain',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  },
  domain: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    background: '#f1f5f9',
  },
  heroPhoto: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
    display: 'block',
  },
  carouselContainer: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  carouselPhoto: {
    flex: 1,
    height: 100,
    objectFit: 'cover',
    borderRadius: 8,
    background: '#f1f5f9',
  },
  carouselNav: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    display: 'flex',
    gap: 4,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  summary: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#334155',
    marginBottom: 12,
  },
  history: {
    fontSize: 13,
    lineHeight: 1.5,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
    padding: '10px 12px',
    background: '#f8fafc',
    borderRadius: 8,
    borderLeft: '3px solid #e2e8f0',
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  primaryButton: {
    background: '#3b82f6',
    color: '#fff',
  },
  secondaryButton: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
  },
  loadingContainer: {
    padding: 24,
    textAlign: 'center',
    color: '#64748b',
  },
  emptyState: {
    padding: 20,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
  },
  facts: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 12,
  },
  fact: {
    background: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
  },
  factLabel: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  factValue: {
    fontWeight: 600,
    color: '#1e293b',
    marginTop: 4,
  },
};

const safeHostFromDomain = (domain) => {
  if (!domain) return null;
  try {
    return new URL(domain.startsWith('http') ? domain : `https://${domain}`).hostname.replace('www.', '');
  } catch {
    return domain;
  }
};

export default function CompanyProfile({ domain = '', result = { items: [], total: 0 }, company: propCompany = null }) {
  const [company, setCompany] = useState(propCompany);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  const host = safeHostFromDomain(domain);
  const total = (result && (result.total ?? result.items?.length)) || 0;

  // Fetch company data when domain changes (if not provided via props)
  useEffect(() => {
    if (propCompany) {
      setCompany(propCompany);
      return;
    }
    
    if (!host) {
      setCompany(null);
      return;
    }

    let cancelled = false;
    const fetchCompany = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/company?domain=${encodeURIComponent(host)}`);
        if (!res.ok) throw new Error('Failed to fetch company data');
        const data = await res.json();
        if (!cancelled) {
          setCompany(data.company || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setCompany(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCompany();
    return () => { cancelled = true; };
  }, [host, propCompany]);

  // Handle regenerate button click
  const handleRegenerate = async () => {
    if (!host) return;
    setLoading(true);
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: host, regenerate: true }),
      });
      if (!res.ok) throw new Error('Failed to regenerate');
      const data = await res.json();
      setCompany(data.company || null);
    } catch (err) {
      // Keep existing company data on error
      console.warn('Regenerate failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle image error - track which images failed
  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Get valid photos (those that haven't errored)
  const validPhotos = (company?.photos || []).filter((_, index) => !imageErrors[index]).slice(0, 3);

  // Loading state
  if (loading && !company) {
    return (
      <aside style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
          <div>Digging up the good stuff...</div>
        </div>
      </aside>
    );
  }

  // Empty state
  if (!host) {
    return (
      <aside style={styles.container}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
          <div>Search for a company to see their profile here!</div>
        </div>
      </aside>
    );
  }

  // Error state (still show basic info)
  const displayCompany = company || {
    name: host,
    domain: host,
    logo: `https://logo.clearbit.com/${host}`,
    photos: [],
    summary: `Hey there! We're still gathering info about ${host}. Check back soon! 🚀`,
    history: null,
  };

  return (
    <aside style={styles.container} aria-live="polite">
      {/* Photo section - hero or carousel */}
      {validPhotos.length > 0 && (
        validPhotos.length === 1 ? (
          <div style={styles.photoContainer}>
            <img
              src={validPhotos[0]}
              alt={`${displayCompany.name} photo`}
              style={styles.heroPhoto}
              onError={() => handleImageError(0)}
            />
          </div>
        ) : (
          <div style={styles.carouselContainer}>
            {validPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`${displayCompany.name} photo ${index + 1}`}
                style={{
                  ...styles.carouselPhoto,
                  opacity: imageErrors[index] ? 0.5 : 1,
                }}
                onError={() => handleImageError(index)}
              />
            ))}
          </div>
        )
      )}

      {/* Header with logo and name */}
      <div style={styles.header}>
        <img
          src={displayCompany.logo || `https://logo.clearbit.com/${host}`}
          alt={`${displayCompany.name} logo`}
          style={styles.logo}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div>
          <h2 style={styles.companyName}>{displayCompany.name || host}</h2>
          <div style={styles.domain}>{host}</div>
        </div>
      </div>

      {/* Summary - playful and informal */}
      {displayCompany.summary && (
        <div style={styles.summary}>
          {displayCompany.summary}
        </div>
      )}

      {/* History section (when available and details expanded) */}
      {showDetails && displayCompany.history && (
        <div style={styles.history}>
          {displayCompany.history}
        </div>
      )}

      {/* Facts grid (when details expanded) */}
      {showDetails && (
        <div style={styles.facts}>
          <div style={styles.fact}>
            <div style={styles.factLabel}>Results found</div>
            <div style={styles.factValue}>{total}</div>
          </div>
          <div style={styles.fact}>
            <div style={styles.factLabel}>Source</div>
            <div style={styles.factValue}>{result.public !== false ? 'Public' : 'Private'}</div>
          </div>
          {displayCompany.description && displayCompany.description !== displayCompany.summary && (
            <div style={{ ...styles.fact, gridColumn: '1 / -1' }}>
              <div style={styles.factLabel}>About</div>
              <div style={{ ...styles.factValue, fontWeight: 400, fontSize: 13, lineHeight: 1.5 }}>
                {displayCompany.description}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={styles.buttonRow}>
        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={() => setShowDetails(!showDetails)}
          type="button"
        >
          {showDetails ? 'Hide details' : 'Show more'}
        </button>
        <button
          style={{ ...styles.button, ...styles.primaryButton, opacity: loading ? 0.7 : 1 }}
          onClick={handleRegenerate}
          disabled={loading}
          type="button"
        >
          {loading ? '✨ Working...' : '🔄 Regenerate'}
        </button>
      </div>

      {/* Error indicator (subtle) */}
      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
          Some data may be unavailable
        </div>
      )}
    </aside>
  );
}

// components/CompanyProfile.js
import React, { useState } from 'react';

/**
 * Extract domain from a website URL
 */
function extractDomainFromUrl(url) {
  if (!url) return null;
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * Get company display values with fallbacks
 */
function getCompanyDisplayValues(company, domain) {
  const displayDomain = domain || extractDomainFromUrl(company?.website) || 'unknown.com';
  return {
    displayDomain,
    logoUrl: company?.logo || `https://logo.clearbit.com/${displayDomain}`,
    companyName: company?.name || displayDomain,
    website: company?.website || `https://${displayDomain}`,
    summary: company?.summary || '',
    description: company?.description || 'No description available.',
    industry: company?.industry || null,
  };
}

/**
 * Decorative Company Profile component
 * Displays logo (Clearbit fallback), company name, website link,
 * conversational summary/description, Show more/Hide details toggle,
 * and a Regenerate button that calls onRegenerate callback.
 */
export default function CompanyProfile({ company, domain, onRegenerate, loading }) {
  const [expanded, setExpanded] = useState(false);

  // Defensive rendering when company or domain is missing
  if (!company && !domain) {
    return (
      <div style={styles.container}>
        <p style={styles.placeholder}>Enter a domain to see company profile</p>
      </div>
    );
  }

  // If loading
  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading company profile...</p>
      </div>
    );
  }

  // Get display values with fallbacks
  const {
    displayDomain,
    logoUrl,
    companyName,
    website,
    summary,
    description,
    industry,
  } = getCompanyDisplayValues(company, domain);

  return (
    <div style={styles.container}>
      {/* Logo */}
      <div style={styles.logoContainer}>
        <img
          src={logoUrl}
          alt={`${companyName} logo`}
          style={styles.logo}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>

      {/* Company Name */}
      <h3 style={styles.name}>{companyName}</h3>

      {/* Industry tag if available */}
      {industry && (
        <span style={styles.industryTag}>{industry}</span>
      )}

      {/* Website Link */}
      <a
        href={website}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.websiteLink}
      >
        {displayDomain}
      </a>

      {/* Conversational Summary */}
      {summary && (
        <p style={styles.summary}>{summary}</p>
      )}

      {/* Description with Show more/Hide details toggle */}
      {description && (
        <div style={styles.descriptionContainer}>
          <p style={styles.description}>
            {expanded ? description : truncateText(description, 120)}
          </p>
          {description.length > 120 && (
            <button
              style={styles.toggleButton}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide details' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Regenerate Button */}
      {onRegenerate && (
        <button
          style={styles.regenerateButton}
          onClick={onRegenerate}
        >
          🔄 Regenerate
        </button>
      )}
    </div>
  );
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

const styles = {
  container: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    marginBottom: '16px',
  },
  placeholder: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: '14px',
    margin: 0,
  },
  loading: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: '14px',
    margin: 0,
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  logo: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    objectFit: 'contain',
    background: '#f9fafb',
  },
  name: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  industryTag: {
    display: 'inline-block',
    background: '#f3f4f6',
    color: '#374151',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '12px',
    marginBottom: '8px',
  },
  websiteLink: {
    display: 'block',
    color: '#2563eb',
    fontSize: '14px',
    textDecoration: 'none',
    textAlign: 'center',
    marginBottom: '12px',
  },
  summary: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
    margin: '0 0 12px 0',
    fontStyle: 'italic',
  },
  descriptionContainer: {
    marginBottom: '12px',
  },
  description: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#6b7280',
    margin: '0 0 8px 0',
  },
  toggleButton: {
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
  },
  regenerateButton: {
    width: '100%',
    padding: '10px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    color: '#374151',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};

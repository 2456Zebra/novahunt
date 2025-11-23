import React from 'react';
import styles from './CompanyProfile.module.css';

/**
 * CompanyProfile - A sidebar component showing company information
 * Designed to be used alongside search results as a sticky right panel
 * 
 * @param {Object} props
 * @param {Object|null} props.company - Company data object with fields like name, domain, industry, etc.
 */
export default function CompanyProfile({ company = null }) {
  // Render placeholder if no company selected
  if (!company) {
    return (
      <aside className={styles.container} aria-live="polite">
        <div className={styles.title}>Company Profile</div>
        <div className={styles.placeholder}>
          Select a company from the search results to view its profile here.
        </div>
      </aside>
    );
  }

  // Extract company data with safe defaults
  const {
    name = 'Unknown Company',
    domain = '',
    industry = '',
    location = '',
    size = '',
    founded = '',
    description = '',
    website = '',
  } = company;

  return (
    <aside className={styles.container} aria-live="polite">
      <div className={styles.title}>Company Profile</div>
      
      <div className={styles.companyName}>{name}</div>
      
      {domain && <div className={styles.domain}>{domain}</div>}
      
      {description && (
        <div className={styles.description}>{description}</div>
      )}
      
      <div className={styles.facts}>
        {industry && (
          <div className={styles.fact}>
            <div className={styles.factLabel}>Industry</div>
            <div className={styles.factValue}>{industry}</div>
          </div>
        )}
        
        {location && (
          <div className={styles.fact}>
            <div className={styles.factLabel}>Location</div>
            <div className={styles.factValue}>{location}</div>
          </div>
        )}
        
        {size && (
          <div className={styles.fact}>
            <div className={styles.factLabel}>Size</div>
            <div className={styles.factValue}>{size}</div>
          </div>
        )}
        
        {founded && (
          <div className={styles.fact}>
            <div className={styles.factLabel}>Founded</div>
            <div className={styles.factValue}>{founded}</div>
          </div>
        )}
      </div>
      
      {website && (
        <a 
          href={website} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.websiteLink}
        >
          Visit Website
        </a>
      )}
    </aside>
  );
}

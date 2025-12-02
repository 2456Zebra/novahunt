import React from 'react';
import styles from './CompanyProfile.module.css';

/**
 * CompanyProfile - Sidebar component showing company information
 * Props:
 *  - company (object | null) - Company data to display
 * 
 * When company is null, shows a placeholder message.
 * This is a plain JSX component without TypeScript.
 */
export default function CompanyProfile({ company }) {
  if (!company) {
    return (
      <aside className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Company Profile</h2>
        </div>
        <div className={styles.placeholder}>
          <p>Select a company from the search results to view its profile here.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Company Profile</h2>
      </div>
      
      {company.logo && (
        <div className={styles.logoContainer}>
          <img 
            src={company.logo} 
            alt={`${company.name} logo`}
            className={styles.logo}
          />
        </div>
      )}
      
      <div className={styles.content}>
        {company.name && (
          <h3 className={styles.companyName}>{company.name}</h3>
        )}
        
        {company.description && (
          <p className={styles.description}>{company.description}</p>
        )}
        
        <div className={styles.details}>
          {company.industry && (
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Industry:</span>
              <span className={styles.detailValue}>{company.industry}</span>
            </div>
          )}
          
          {company.location && (
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Location:</span>
              <span className={styles.detailValue}>{company.location}</span>
            </div>
          )}
          
          {company.founded && (
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Founded:</span>
              <span className={styles.detailValue}>{company.founded}</span>
            </div>
          )}
          
          {company.size && (
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Size:</span>
              <span className={styles.detailValue}>{company.size}</span>
            </div>
          )}
          
          {company.website && (
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Website:</span>
              <a 
                href={company.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.link}
              >
                {company.website}
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

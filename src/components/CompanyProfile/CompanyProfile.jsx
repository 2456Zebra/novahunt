import React from "react";
import styles from "./CompanyProfile.module.css";

/**
 * CompanyProfile JSX component (plain JS / JSX).
 * Props:
 *  - company: object or null
 *  - loading: boolean
 *  - onClose: function
 */
export default function CompanyProfile({ company = null, loading = false, onClose }) {
  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>
          <div className={`${styles.skeleton} ${styles.logo}`} />
          <div className={`${styles.skeleton} ${styles.title}`} />
          <div className={`${styles.skeleton} ${styles.line}`} />
          <div className={`${styles.skeleton} ${styles.line}`} />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className={styles.root}>
        <p style={{ color: "var(--muted, #888)" }}>No company selected</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        {company.logo ? (
          <img src={company.logo} alt={company.name} className={styles.logoImg} />
        ) : (
          <div className={styles.logoPlaceholder} />
        )}
        <div className={styles.titleWrap}>
          <h3 className={styles.titleText}>{company.name || "Company"}</h3>
          {company.rating && (
            <span className={styles.rating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= company.rating ? styles.starFilled : styles.star}
                >
                  ★
                </span>
              ))}
            </span>
          )}
        </div>
        {onClose && (
          <button className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>

      <div className={styles.body}>
        {company.industry && (
          <div className={styles.row}>
            <strong>Industry:</strong>
            {company.industry}
          </div>
        )}
        {company.location && (
          <div className={styles.row}>
            <strong>Location:</strong>
            {company.location}
          </div>
        )}
        {company.size && (
          <div className={styles.row}>
            <strong>Size:</strong>
            {company.size}
          </div>
        )}
        {company.founded && (
          <div className={styles.row}>
            <strong>Founded:</strong>
            {company.founded}
          </div>
        )}
        {company.description && (
          <div className={styles.description}>{company.description}</div>
        )}
      </div>

      <div className={styles.footer}>
        {company.website && (
          <div className={styles.socials}>
            <a href={company.website} target="_blank" rel="noopener noreferrer">
              Website
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

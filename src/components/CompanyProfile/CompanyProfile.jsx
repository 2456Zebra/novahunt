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
      <aside className={`${styles.root} ${styles.loading}`} aria-live="polite">
        <div className={`${styles.skeleton} ${styles.logo}`} />
        <div className={`${styles.skeleton} ${styles.title}`} />
        <div className={`${styles.skeleton} ${styles.line}`} />
        <div className={`${styles.skeleton} ${styles.line}`} />
      </aside>
    );
  }

  if (!company) {
    return (
      <aside className={styles.root} aria-live="polite">
        <div className={styles.empty}>No company information available.</div>
      </aside>
    );
  }

  return (
    <aside className={styles.root} aria-label={`${company.name} profile`}>
      <div className={styles.header}>
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoUrl} alt={`${company.name} logo`} className={styles.logoImg} />
        ) : (
          <div className={styles.logoPlaceholder} aria-hidden />
        )}

        <div className={styles.titleWrap}>
          <h3 className={styles.titleText}>{company.name}</h3>
          {typeof company.rating !== "undefined" && (
            <div className={styles.rating} aria-label={`Rating ${company.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < Math.round(company.rating) ? styles.starFilled : styles.star}>
                  ★
                </span>
              ))}
            </div>
          )}
        </div>

        <button className={styles.close} onClick={onClose} aria-label="Close company profile">
          ✕
        </button>
      </div>

      <div className={styles.body}>
        {company.industry && (
          <div className={styles.row}>
            <strong>Industry:</strong> {company.industry}
          </div>
        )}
        {company.location && (
          <div className={styles.row}>
            <strong>Location:</strong> {company.location}
          </div>
        )}
        {company.employeeCount && (
          <div className={styles.row}>
            <strong>Employees:</strong> {company.employeeCount}
          </div>
        )}
        {typeof company.openPositions !== "undefined" && (
          <div className={styles.row}>
            <strong>Open roles:</strong> {company.openPositions}
          </div>
        )}
        {company.website && (
          <div className={styles.row}>
            <strong>Website:</strong> <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
          </div>
        )}
        {company.description && (
          <div className={styles.description}>{company.description}</div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.socials}>
          {company.linkedin && (
            <a href={company.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a>
          )}
          {company.twitter && (
            <a href={company.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">Twitter</a>
          )}
        </div>
      </div>
    </aside>
  );
}

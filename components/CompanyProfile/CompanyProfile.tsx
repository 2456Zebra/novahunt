import React from "react";
import "./CompanyProfile.css";

export type Company = {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  location?: string;
  website?: string;
  industry?: string;
  employeeCount?: string; // e.g. "51-200"
  rating?: number; // 0-5
  openPositions?: number;
  twitter?: string;
  linkedin?: string;
};

type Props = {
  company: Company | null;
  loading?: boolean;
  onClose?: () => void; // optional for collapsible mobile
};

export const CompanyProfile: React.FC<Props> = ({ company, loading, onClose }) => {
  if (loading) {
    return (
      <aside className="cp-root cp-loading" aria-live="polite">
        <div className="cp-skeleton logo" />
        <div className="cp-skeleton title" />
        <div className="cp-skeleton line" />
        <div className="cp-skeleton line" />
      </aside>
    );
  }

  if (!company) {
    return (
      <aside className="cp-root" aria-live="polite">
        <div className="cp-empty">No company information available.</div>
      </aside>
    );
  }

  return (
    <aside className="cp-root" aria-label={`${company.name} profile`}>
      <div className="cp-header">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt={`${company.name} logo`} className="cp-logo" />
        ) : (
          <div className="cp-logo-placeholder" aria-hidden />
        )}
        <div className="cp-title">
          <h3>{company.name}</h3>
          {company.rating !== undefined && (
            <div className="cp-rating" aria-label={`Rating ${company.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < Math.round(company.rating) ? "star filled" : "star"}>★</span>
              ))}
            </div>
          )}
        </div>
        <button className="cp-close" onClick={onClose} aria-label="Close company profile">✕</button>
      </div>

      <div className="cp-body">
        {company.industry && <div className="cp-row"><strong>Industry:</strong> {company.industry}</div>}
        {company.location && <div className="cp-row"><strong>Location:</strong> {company.location}</div>}
        {company.employeeCount && <div className="cp-row"><strong>Employees:</strong> {company.employeeCount}</div>}
        {company.openPositions !== undefined && (
          <div className="cp-row"><strong>Open roles:</strong> {company.openPositions}</div>
        )}
        {company.website && (
          <div className="cp-row">
            <strong>Website:</strong>{" "}
            <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
          </div>
        )}
        <div className="cp-description">{company.description}</div>
      </div>

      <div className="cp-footer" aria-hidden={false}>
        <div className="cp-socials">
          {company.linkedin && (
            <a href={company.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              LinkedIn
            </a>
          )}
          {company.twitter && (
            <a href={company.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              Twitter
            </a>
          )}
        </div>
      </div>
    </aside>
  );
};

export default CompanyProfile;

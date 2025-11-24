// File: components/CompanyProfilePanel.jsx
import React, { useEffect, useRef } from 'react';

export default function CompanyProfilePanel({ domain, companyInfo }) {
  const panelRef = useRef(null);

  useEffect(() => {
    // Auto-scroll when domain changes
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [domain]);

  if (!companyInfo) return null;

  const {
    name,
    logo,
    tagline,
    industry,
    employeeCount,
    hq,
    summary,
  } = companyInfo;

  // Fallback logo if none provided
  const logoUrl = logo || `/images/company-placeholder.png`;

  return (
    <div
      ref={panelRef}
      className="p-6 bg-white rounded-2xl border shadow-sm w-full flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="w-16 h-16 object-contain rounded-lg border"
        />
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">{name}</h2>
          {tagline && <p className="text-gray-600 text-sm">{tagline}</p>}
        </div>
      </div>

      <div className="text-sm text-gray-700 space-y-1">
        {industry && <div><strong>Industry:</strong> {industry}</div>}
        {employeeCount && <div><strong>Employees:</strong> {employeeCount}</div>}
        {hq && <div><strong>HQ:</strong> {hq}</div>}
      </div>

      {summary && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
          {summary}
        </div>
      )}
    </div>
  );
}

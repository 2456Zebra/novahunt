'use client';

import React, { useState, useEffect } from 'react';

// CompanyProfile data generator (placeholder for now)
const generateCompanyProfile = (domain) => {
  if (!domain) return null;

  const name = domain.replace(/^www\./, '').split('.')[0];
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    tagline: 'Leading company in its field.',
    employees: `${Math.floor(Math.random() * 5000) + 50} employees`,
    industry: 'Technology / AI',
    location: 'Headquarters in San Francisco, CA',
    summary:
      'This company has a strong reputation for innovation and market leadership. Known for delivering high-quality products and services.',
    logo: '/images/company-placeholder.png', // use a generic placeholder image
  };
};

export default function SearchResults({ domain, results = [] }) {
  const [revealed, setRevealed] = useState(new Set());
  const [companyProfile, setCompanyProfile] = useState(generateCompanyProfile(domain));

  useEffect(() => {
    setCompanyProfile(generateCompanyProfile(domain));
  }, [domain]);

  // Group results by department
  const groupedResults = results.reduce((acc, r) => {
    const dept = r.department || 'Other';
    acc[dept] = acc[dept] || [];
    acc[dept].push(r);
    return acc;
  }, {});

  // Auto-expand the largest department
  const largestDept = Object.keys(groupedResults).reduce((a, b) =>
    groupedResults[a].length >= groupedResults[b].length ? a : b,
  );

  return (
    <div className="flex gap-8 mt-8 max-w-7xl mx-auto">
      {/* Left: Search results */}
      <div className="flex-1 space-y-6">
        <h2 className="text-2xl font-bold">Results ({results.length})</h2>
        {Object.keys(groupedResults).map((dept) => {
          const isExpanded = dept === largestDept;
          return (
            <div key={dept} className="border rounded-xl p-4">
              <h3
                className="font-semibold cursor-pointer"
                onClick={() => {} /* Can add toggle if you want collapse/expand */}
              >
                {dept} ({groupedResults[dept].length})
              </h3>
              {isExpanded && (
                <div className="mt-2 space-y-3">
                  {groupedResults[dept].map((r, idx) => {
                    const maskedEmail = r.email
                      ? r.email.replace(/(^[^@]{1})[^@]*(@.*)$/, (m, a, b) => `${a}*****${b}`)
                      : '';
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{r.first_name} {r.last_name}</div>
                          <div className="text-sm text-gray-600">{r.position}</div>
                          <div className="text-sm font-mono mt-1">
                            {revealed.has(r.email) ? r.email : maskedEmail}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {r.score}% trust
                          </span>
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={() => setRevealed((s) => new Set([...s, r.email]))}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Reveal
                            </button>
                            {r.source && (
                              <a
                                href={r.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                              >
                                Source
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Company Profile */}
      <div className="w-80 sticky top-24 bg-white border rounded-xl p-6 shadow-sm">
        {companyProfile ? (
          <>
            <div className="text-center">
              <img
                src={companyProfile.logo}
                alt={companyProfile.name}
                className="w-32 h-32 mx-auto rounded-lg object-cover"
              />
              <h3 className="text-xl font-bold mt-4">{companyProfile.name}</h3>
              <p className="text-gray-600 mt-1">{companyProfile.tagline}</p>
              <p className="text-gray-600 mt-1">{companyProfile.employees}</p>
              <p className="text-gray-600 mt-1">{companyProfile.industry}</p>
              <p className="text-gray-600 mt-1">{companyProfile.location}</p>
              <p className="text-sm mt-3">{companyProfile.summary}</p>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">Loading company info…</div>
        )}
      </div>
    </div>
  );
}

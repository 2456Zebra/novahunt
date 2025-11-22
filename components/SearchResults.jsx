'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SearchResults({ domain, results = [], session }) {
  const [revealed, setRevealed] = useState(new Set());
  const [companyInfo, setCompanyInfo] = useState(null);

  // Load company info whenever domain changes
  useEffect(() => {
    if (!domain) return;

    const clean = domain.replace(/^www\./, '');
    const name = clean.split('.')[0];
    const titleCase = name.charAt(0).toUpperCase() + name.slice(1);

    setCompanyInfo({
      name: titleCase,
      logo: `https://logo.clearbit.com/${clean}?size=160`,
      description: `${titleCase} is a leading company in its industry.`,
      website: `https://${clean}`,
    });
  }, [domain]);

  const visibleResults = session ? results : results.slice(0, 3);

  return (
    <div className="mt-10 max-w-7xl mx-auto px-4">
      <div className="grid lg:grid-cols-3 gap-10">
        {/* LEFT – Results */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-2xl font-bold mb-4">Results ({results.length})</h2>
          {visibleResults.map((r, i) => (
            <div key={i} className="bg-white border rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.first_name} {r.last_name}</p>
                  <p className="text-gray-600 text-sm">{r.position}</p>
                  <p className="font-mono text-sm mt-2">
                    {revealed.has(r.email) ? r.email : '••••••••@' + r.email.split('@')[1]}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {r.score}% confidence
                  </span>
                  {!revealed.has(r.email) && (
                    <button
                      onClick={() => setRevealed(s => new Set([...s, r.email]))}
                      className="block mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      {session ? 'Reveal' : 'Sign in to Reveal'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!session && results.length > 3 && (
            <p className="text-center text-sm text-gray-600 mt-6">
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-signin'))} className="text-blue-600 hover:underline font-medium">
                Sign in to see all {results.length} results
              </button>
            </p>
          )}
        </div>

        {/* RIGHT – Company Profile */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border rounded-xl p-8 shadow-sm">
            {companyInfo ? (
              <>
                <div className="text-center">
                  <Image
                    src={companyInfo.logo}
                    alt={companyInfo.name}
                    width={160}
                    height={160}
                    className="rounded-lg mx-auto"
                    unoptimized
                  />
                  <h3 className="text-2xl font-bold mt-6">{companyInfo.name}</h3>
                  <p className="text-gray-600 mt-3 text-sm">{companyInfo.description}</p>
                </div>
                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 block w-full text-center py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Visit Website
                </a>
              </>
            ) : (
              <div className="text-center text-gray-400">Loading company info…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

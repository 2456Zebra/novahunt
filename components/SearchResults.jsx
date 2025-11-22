'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SearchResults({ domain, results = [], session }) {
  const [revealed, setRevealed] = useState(new Set());
  const [companyInfo, setCompanyInfo] = useState(null);

  // Load company info whenever domain changes
  useEffect(() => {
    if (!domain) {
      setCompanyInfo(null);
      return;
    }

    const clean = domain.replace(/^www\./, '');
    const name = clean.split('.')[0];
    const titleCase = name.charAt(0).toUpperCase() + name.slice(1);

    setCompanyInfo({
      name: titleCase,
      logo: `https://logo.clearbit.com/${clean}?size=160`,
      description: `${titleCase} is a leading company in its industry.`,
      website: `https://${clean}`,
      domain: clean,
    });
  }, [domain]);

  // If not signed in, show only the first 3 results (existing behavior)
  const visibleResults = session ? results : results.slice(0, 3);

  // helper to show masked email
  const maskedEmail = (email = '') => {
    if (!email.includes('@')) return email;
    const [local, domainPart] = email.split('@');
    if (local.length <= 2) return '••••@' + domainPart;
    const keep = Math.min(3, Math.max(1, Math.floor(local.length / 2)));
    return local.slice(0, keep).replace(/./g, '*') + '@' + domainPart;
  };

  return (
    <div className="mt-10 max-w-7xl mx-auto px-4">
      <div className="grid lg:grid-cols-3 gap-10">
        {/* LEFT – Results (span 2) */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-2xl font-bold mb-4">Results ({results.length})</h2>

          {visibleResults.map((r, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-4">
                {/* Left block: small Reveal + person info */}
                <div className="flex-1 min-w-0 flex items-start gap-3">
                  {/* Small reveal button placed left of the name */}
                  <div className="flex-shrink-0 mt-1">
                    {!revealed.has(r.email) ? (
                      <button
                        onClick={() => {
                          if (!session) {
                            // preserve existing behavior: prompt sign-in via dispatched event
                            window.dispatchEvent(new CustomEvent('open-signin'));
                            return;
                          }
                          setRevealed(s => new Set([...s, r.email]));
                        }}
                        aria-label={session ? `Reveal ${r.first_name} ${r.last_name} email` : 'Sign in to reveal'}
                        className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-md transition
                          ${session ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                      >
                        {session ? 'Reveal' : 'Sign in'}
                      </button>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
                        Revealed
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{r.first_name} {r.last_name}</p>
                    <p className="text-gray-600 text-xs truncate">{r.position}</p>

                    <div className="mt-2 font-mono text-xs text-gray-800">
                      {revealed.has(r.email) ? r.email : maskedEmail(r.email)}
                    </div>
                  </div>
                </div>

                {/* Right block: score and source */}
                <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {r.score}% confidence
                  </span>

                  <a
                    href={r.source || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:underline"
                    onClick={(e) => {
                      // If source is not a valid URL, prevent navigation
                      if (!r.source) e.preventDefault();
                    }}
                  >
                    Source
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* Sign-in CTA to see all results (existing behavior) */}
          {!session && results.length > 3 && (
            <p className="text-center text-sm text-gray-600 mt-6">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-signin'))}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in to see all {results.length} results
              </button>
            </p>
          )}
        </div>

        {/* RIGHT – Company Profile (sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-gradient-to-b from-white via-white to-gray-50 border rounded-xl p-6 shadow-sm">
            {companyInfo ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    <Image
                      src={companyInfo.logo}
                      alt={companyInfo.name}
                      width={56}
                      height={56}
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">{companyInfo.name}</h3>
                    <div className="text-xs text-gray-500">{companyInfo.domain}</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mt-4">{companyInfo.description}</p>

                {/* Decorative quickfacts */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="text-xs text-gray-500">Employees</div>
                  <div className="text-sm font-medium text-gray-700">—</div>

                  <div className="text-xs text-gray-500">Industry</div>
                  <div className="text-sm font-medium text-gray-700">—</div>

                  <div className="text-xs text-gray-500">Founded</div>
                  <div className="text-sm font-medium text-gray-700">—</div>

                  <div className="text-xs text-gray-500">Location</div>
                  <div className="text-sm font-medium text-gray-700">—</div>
                </div>

                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block w-full text-center py-2 bg-black text-white rounded-md hover:bg-gray-900 transition text-sm"
                >
                  Visit Website
                </a>

                {/* Small credit / decorative footer */}
                <div className="mt-3 text-xs text-gray-400 text-center">
                  Decorative company overview — auto-generated
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400">Enter a domain to see the company profile</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

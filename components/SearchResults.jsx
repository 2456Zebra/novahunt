'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SearchResults({ domain, results = [], session }) {
  const [revealed, setRevealed] = useState(new Set());
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    if (!domain) return;

    const cleanDomain = domain.replace(/^www\./, '');
    const name = cleanDomain.split('.')[0];
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

    const mockInfo = {
      name: capitalized,
      logo: `https://logo.clearbit.com/${cleanDomain}?size=160`,
      description: `${capitalized} is a global leader in its industry, known for innovation and excellence.`,
      founded: '1900–2020',
      employees: '10,000–250,000+',
      headquarters: 'United States',
      website: `https://${cleanDomain}`,
      industry: 'Technology / Consumer / Finance / Healthcare',
    };

    setTimeout(() => {
      setCompanyInfo(mockInfo);
      setLoadingInfo(false);
    }, 900);
  }, [domain]);

  const handleReveal = async (email) => {
    if (!session) {
      window.dispatchEvent(new CustomEvent('open-signin'));
      return;
    }
    // reveal logic here (we’ll connect usage later)
    setRevealed(prev => new Set([...prev, email]));
  };

  const visibleResults = session ? results : results.slice(0, 3);

  return (
    <div className="mt-10 max-w-7xl mx-auto px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: Results */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
              Results ({results.length})
            </span>
            {!session && results.length > 3 && (
              <p className="text-sm text-gray-600">
                Showing 3 of {results.length}.{' '}
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-signin'))} className="text-blue-600 font-medium hover:underline">
                  Sign in to see all
                </button>
              </p>
            )}
          </div>

          <div className="space-y-4">
            {visibleResults.map((r, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{r.first_name} {r.last_name}</h3>
                    <p className="text-gray-600">{r.position}</p>
                    <p className="font-mono text-sm mt-2">
                      {revealed.has(r.email) ? r.email : '••••••••@' + r.email.split('@')[1]}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {r.score}% confidence
                    </span>
                    {!revealed.has(r.email) && (
                      <button
                        onClick={() => handleReveal(r.email)}
                        className="mt-3 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                      >
                        {session ? 'Reveal Email' : 'Sign in to Reveal'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Company Profile */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {loadingInfo ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                <div className="animate-pulse">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
                </div>
              </div>
            ) : companyInfo ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div className="text-center">
                  <Image
                    src={companyInfo.logo}
                    alt={companyInfo.name}
                    width={160}
                    height={160}
                    className="rounded-xl mx-auto shadow-lg"
                    unoptimized
                  />
                  <h2 className="text-2xl font-bold mt-6">{companyInfo.name}</h2>
                  <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-xs mx-auto">
                    {companyInfo.description}
                  </p>

                  <div className="mt-8 space-y-4 text-left text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Founded</span><span className="font-medium">{companyInfo.founded}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Employees</span><span className="font-medium">{companyInfo.employees}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">HQ</span><span className="font-medium">{companyInfo.headquarters}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Industry</span><span className="font-medium">{companyInfo.industry}</span></div>
                  </div>

                  <a
                    href={companyInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 block w-full py-3 bg-gray-900 text-white text-center font-medium rounded-lg hover:bg-black transition"
                  >
                    Visit Website
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

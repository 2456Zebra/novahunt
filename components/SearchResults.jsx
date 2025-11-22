import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SearchResults({ domain, results = [], session }) {
  const [revealed, setRevealed] = useState(new Set());
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Fetch company profile (mocked for now — we can plug real Clearbit/Apollo later)
  useEffect(() => {
    if (!domain) return;

    const mockInfo = {
      name: domain.replace(/^www\./, '').replace(/\.(com|co|io|ai).*/, '').replace(/^\w/, c => c.toUpperCase()),
      logo: `https://logo.clearbit.com/${domain}?size=120`,
      description: `Leading company in its industry, trusted by millions worldwide.`,
      founded: '1892',
      employees: '100,000+',
      headquarters: 'Atlanta, Georgia, USA',
      website: `https://${domain}`,
      industry: 'Beverages',
    };

    setTimeout(() => {
      setCompanyInfo(mockInfo);
      setLoadingInfo(false);
    }, 800);
  }, [domain]);

  const handleReveal Milky Way = async (email) => {
    if (!session) {
      window.dispatchEvent(new CustomEvent('open-signin'));
      return;
    }

    const res = await fetch('/api/usage/increment', {
      method: 'POST',
      headers: { 'x-nh-session': session, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'reveals' })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.over) {
        alert('Reveal limit reached. Upgrade to continue.');
        return;
      }
      setRevealed(prev => new Set([...prev, email]));
      window.dispatchEvent(new CustomEvent('account-usage-updated'));
    }
  };

  const visibleResults = session ? results : results.slice(0, 3);

  return (
    <div className="mt-8 max-w-7xl mx-auto px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: Email Results */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <button className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition">
              Results ({results.length})
            </button>
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
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {r.first_name} {r.last_name}
                    </h3>
                    <p className="text-gray-600">{r.position}</p>
                    <p className="font-mono text-sm mt-2 text-gray-800">
                      {revealed.has(r.email) ? r.email : '••••••••••••@' + r.email.split('@')[1]}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {r.score}% confidence
                    </span>
                    {!revealed.has(r.email) && (
                      <button
                        onClick={() => handleReveal(r.email)}
                        className="mt-3 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
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

        {/* RIGHT: Company Profile Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {loadingInfo ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <div className="animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
                </div>
              </div>
            ) : companyInfo ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Image
                      src={companyInfo.logo}
                      alt={companyInfo.name}
                      width={120}
                      height={120}
                      className="rounded-xl shadow-lg"
                      unoptimized
                    />
                  </div>
                  <h2 className="text-2xl font-bold mt-6">{companyInfo.name}</h2>
                  <p className="text-gray-600 mt-2 max-w-xs">{companyInfo.description}</p>

                  <div className="w-full mt-8 space-y-4 text-left text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Founded</span>
                      <span className="font-medium">{companyInfo.founded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Employees</span>
                      <span className="font-medium">{companyInfo.employees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">HQ</span>
                      <span className="font-medium">{companyInfo.headquarters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Industry</span>
                      <span className="font-medium">{companyInfo.industry}</span>
                    </div>
                  </div>

                  <a
                    href={companyInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition text-center"
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

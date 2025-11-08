// pages/index.js — FULL TAILWIND + EMAILS + YOUR ROUND 2 STYLE
'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setMessage('');

    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: query })
      });
      const data = await res.json();
      setResults(data.results || []);
      setMessage(data.message || 'No emails found.');
    } catch (err) {
      setMessage('Search failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <>
      {/* Tailwind CDN (fixes black screen) */}
      <script src="https://cdn.tailwindcss.com"></script>

      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">NovaHunt</h1>
              </div>
              <nav className="flex space-x-8">
                <a href="/upgrade" className="text-blue-600 hover:text-blue-800 font-medium">Upgrade</a>
                <a href="/signin" className="text-gray-700 hover:text-gray-900 font-medium">Sign In</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Find Any Business Email
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered. Real results. For less than a coffee.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter domain (e.g. vercel.com)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Hunting...' : 'Hunt'}
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Free: 5 searches/mo | PRO: Unlimited — <a href="/upgrade" className="text-blue-600 underline">$10/month</a>
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className="mt-8">
                <p className={`text-lg font-medium ${results.length > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {message}
                </p>
              </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
              <div className="mt-8 bg-gray-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{results.length} Emails Found</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.role || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              r.score > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {r.score}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
            © 2025 NovaHunt. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}

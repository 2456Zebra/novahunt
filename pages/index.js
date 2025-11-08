// pages/index.js — SELF-CONTAINED STYLES + EMAILS (NO TAILWIND NEEDED)
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
    <html>
      <head>
        {/* Inline Tailwind — Forces styles, no build needed */}
        <script src="https://cdn.tailwindcss.com"></script>
        <style jsx global>{`
          body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
          .min-h-screen { min-height: 100vh; }
        `}</style>
      </head>
      <body className="min-h-screen bg-white text-gray-900">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">NovaHunt</h1>
              <nav className="space-x-4">
                <a href="/upgrade" className="text-blue-600 hover:text-blue-800 font-medium">Upgrade $10/mo</a>
                <a href="/signin" className="text-gray-700 hover:text-gray-900 font-medium">Sign In</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Find Any Business Email</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered email finder. Real results from public sources. Unlimited with PRO.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., vercel.com"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Hunting...' : 'Hunt Emails'}
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Free trial: 5 searches | <a href="/upgrade" className="text-blue-600 underline">Go PRO for unlimited</a>
            </p>
          </div>

          {/* Message */}
          {message && (
            <p className={`text-lg font-medium mb-4 ${results.length > 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {message}
            </p>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="max-w-4xl mx-auto bg-gray-50 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-gray-800">{results.length} Emails Found</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{r.role || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-500">
          © 2025 NovaHunt. Built for email hunters. <a href="/upgrade" className="text-blue-600 underline">Start PRO trial</a>
        </footer>
      </body>
    </html>
  );
}

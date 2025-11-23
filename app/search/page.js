// app/search/page.js  ← FINAL VERSION – paste this and you're done forever
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import ResultItem from '@/components/ResultItem';
import RightPanel from '@/components/RightPanel';

export default function SearchPage({ searchParams }) {
  const query = (searchParams?.q || '').trim();
  if (!query) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-2xl">Search a domain</div>;

  const domain = query.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  const name = domain.split('.').shift().split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  const [emails, setEmails] = useState([]);
  const [logo, setLogo] = useState('https://via.placeholder.com/120/336699/FFFFFF?text=?');
  const [summary, setSummary] = useState('Loading…');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Hunter
      try {
        const r = await axios.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&limit=50&api_key=YOUR_HUNTER_KEY`);
        setEmails(r.data.data.emails || []);
      } catch (e) { setEmails([]); }

      // Logo
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      setLogo((await axios.get(logoUrl, { timeout: 4000 }).then(() => logoUrl).catch(() => `https://via.placeholder.com/120/336699/FFFFFF?text=${name[0]}`)));

      // Summary
      try {
        const w = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
        setSummary(w.data.extract ? w.data.extract.slice(0, 800) + (w.data.extract.length > 800 ? '…' : '') : `${name} is an innovative company making big moves.`);
      } catch (e) {
        setSummary(`${name} is pushing boundaries and shaping the future.`);
      }

      setLoading(false);
    })();
  }, [domain, name]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10">
          Results for <span className="text-blue-600">{domain}</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT – Emails */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Email Results</h2>
                <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full">{emails.length} found</span>
              </div>
              {loading ? <p>Loading…</p> : emails.length === 0 ? <p className="text-gray-500">No emails found</p> :
                <div className="space-y-4">
                  {emails.slice(0, 30).map((e, i) => <ResultItem key={i} email={e} />)}
                </div>
              }
            </div>
          </div>

          {/* RIGHT – Company Profile */}
          <div className="lg:col-span-1">
            <RightPanel name={name} logo={logo} summary={summary} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

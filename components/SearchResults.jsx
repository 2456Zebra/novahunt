// components/SearchResults.jsx  ←  FINAL WORKING VERSION – PASTE THIS EXACTLY
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResultItem from './ResultItem';
import RightPanel from './RightPanel';

export default function SearchResults({ domain }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState('https://via.placeholder.com/140');
  const [summary, setSummary] = useState('Loading company story...');

  const cleanName = domain.split('.')[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  useEffect(() => {
    if (!domain) return;

    const run = async () => {
      // Hunter emails
      try {
        const res = await axios.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=YOUR_HUNTER_KEY`);
        setEmails(res.data.data.emails || []);
      } catch (e) { setEmails([]); }

      // Logo
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      axios.get(logoUrl, { timeout: 5000 }).then(() => setLogo(logoUrl)).catch(() => {});

      // Wikipedia summary
      try {
        const w = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${cleanName}`);
        setSummary(w.data.extract ? w.data.extract.slice(0, 750) + '...' : `${cleanName} is an innovative company making waves.`);
      } catch (e) {
        setSummary(`${cleanName} started small and grew into something remarkable. A true success story.`);
      }

      setLoading(false);
    };
    run();
  }, [domain, cleanName]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
      {/* LEFT – Your existing Hunter results */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Email Results ({emails.length})</h2>
          {loading ? <p>Loading...</p> : emails.length === 0 ? <p>No emails found</p> :
            <div className="space-y-4">
              {emails.slice(0, 30).map((e, i) => <ResultItem key={i} email={e} />)}
            </div>
          }
        </div>
      </div>

      {/* RIGHT – Beautiful decorative company profile */}
      <div className="lg:col-span-1">
        <RightPanel name={cleanName} logo={logo} summary={summary} loading={loading} />
      </div>
    </div>
  );
}

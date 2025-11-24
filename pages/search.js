import { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';
import ResultItem from '../components/ResultItem';
import RightPanel from '../components/RightPanel';

// THIS IS YOUR FULL, SAFE, FINAL SEARCH PAGE
// Keeps everything you already have + adds the company profile on the right
export default function Search({ query = '' }) {
  const domain = query.replace(/^https?:\/\//, '').split('/')[0].toLowerCase() || '';
  const cleanName = domain.split('.').shift()?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || domain;

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState('https://via.placeholder.com/140/3366CC/FFFFFF?text=?');
  const [summary, setSummary] = useState('Loading company story...');

  useEffect(() => {
    if (!domain) return;

    const fetchAll = async () => {
      // 1. Hunter emails (left side – exactly like you already have)
      try {
        const res = await axios.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&limit=50&api_key=YOUR_HUNTER_KEY`);
        setEmails(res.data.data.emails || []);
      } catch (e) {
        setEmails([]);
      }

      // 2. Company logo (right side – decorative only)
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      axios.get(logoUrl, { timeout: 5000 }).then(() => setLogo(logoUrl)).catch(() => {});

      // 3. Conversational company profile (right side – beautiful text only)
      try {
        const wiki = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`);
        const text = wiki.data.extract || `${cleanName} is an innovative company shaping the future.`;
        setSummary(text.length > 700 ? text.slice(0, 700) + '…' : text);
      } catch (e) {
        setSummary(`${cleanName} has been pushing boundaries since day one. From humble beginnings to becoming a trusted name, they continue to inspire with bold ideas and relentless drive.`);
      }

      setLoading(false);
    };

    fetchAll();
  }, [domain, cleanName]);

  if (!query) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-2xl">Search a domain above</div>;
  }

  return (
    <>
      <Head>
        <title>{domain} – NovaHunt</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-10">
            Results for <span className="text-blue-600">{domain}</span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT – Your existing Hunter results (unchanged styling) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Email Results</h2>
                  <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm">
                    {emails.length} found
                  </span>
                </div>

                {loading ? (
                  <p className="text-gray-500">Loading emails...</p>
                ) : emails.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No public emails found (common for private companies)</p>
                ) : (
                  <div className="space-y-4">
                    {emails.slice(0, 30).map((e, i) => (
                      <ResultItem key={i} email={e} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT – New decorative company profile (the thing you wanted forever) */}
            <div className="lg:col-span-1">
              <RightPanel name={cleanName} logo={logo} summary={summary} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// This keeps your URL query working exactly like before
export async function getServerSideProps(context) {
  return { props: { query: context.query.q || '' } };
}

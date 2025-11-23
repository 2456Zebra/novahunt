// pages/search.js — FINAL VERSION — just paste this entire file and commit
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import ResultItem from '../components/ResultItem';
import RightPanel from '../components/RightPanel';

export default function Search({ searchParams }) {
  const query = (searchParams?.q || '').trim();
  if (!query) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-xl">Type a domain to search</div>;
  }

  const domain = query.replace('https://', '').replace('http://', '').split('/')[0].toLowerCase();
  const cleanName = domain.replace(/\..*$/, '').split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  const [emails, setEmails] = useState([]);
  const [logo, setLogo] = useState('https://via.placeholder.com/120/336699/FFFFFF?text=?');
  const [summary, setSummary] = useState('Loading company story...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      // Hunter emails
      try {
        const res = await axios.get(`https://api.hunter.io/v2/domain-search?domain=${domain}&limit=50&api_key=YOUR_HUNTER_KEY`);
        setEmails(res.data.data.emails || []);
      } catch (e) { setEmails([]); }

      // Logo
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      const ok = await axios.get(logoUrl, { timeout: 4000 }).then(() => true).catch(() => false);
      setLogo(ok ? logoUrl : `https://via.placeholder.com/120/336699/FFFFFF?text=${cleanName[0]}`);

      // Wikipedia summary
      try {
        const wiki = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`);
        setSummary((wiki.data.extract || 'Innovative company on the rise.').slice(0, 800) + (wiki.data.extract?.length > 800 ? '...' : ''));
      } catch (e) {
        setSummary(`${cleanName} is building the future, one bold step at a time.`);
      }

      setLoading(false);
    };
    run();
  }, [domain, cleanName]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10">
          Results for <span className="text-blue-600">{domain}</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8

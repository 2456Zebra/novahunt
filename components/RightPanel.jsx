// components/RightPanel.jsx
import React, { useEffect, useState } from 'react';
import CorporateProfile from './CorporateProfile';
import axios from 'axios';

export default function RightPanel({ domain }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!domain) return;

    const fetchCompany = async () => {
      try {
        const res = await axios.get(`/api/company/${domain}`);
        setCompany(res.data);
      } catch (err) {
        console.error('Failed to fetch company data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [domain]);

  return (
    <div style={{ padding: '16px', borderLeft: '1px solid #E5E7EB', minWidth: '320px' }}>
      {loading && <p>Loading company info...</p>}
      {!loading && !company && <p>No company info found.</p>}
      {company && <CorporateProfile company={company} />}
    </div>
  );
}

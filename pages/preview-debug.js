import React, { useEffect, useState } from 'react';

export default function PreviewDebug() {
  const [host, setHost] = useState('');
  const [vercelEnv, setVercelEnv] = useState(process.env.VERCEL_ENV || 'undefined');
  const [commit, setCommit] = useState(process.env.VERCEL_GIT_COMMIT_SHA || 'undefined');
  const [companyResp, setCompanyResp] = useState(null);
  const [companyErr, setCompanyErr] = useState(null);

  useEffect(() => {
    setHost(typeof window !== 'undefined' ? window.location.href : 'server');
    // Try fetch to the company API for coca-cola.com (client fetch)
    (async () => {
      try {
        const res = await fetch('/api/company?domain=coca-cola.com');
        const text = await res.text();
        setCompanyResp({ status: res.status, body: text });
      } catch (err) {
        setCompanyErr(String(err));
      }
    })();
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, Arial', padding: 24 }}>
      <h2>Preview debug</h2>
      <div><strong>Window location:</strong> {host}</div>
      <div><strong>VERCEL_ENV:</strong> {vercelEnv}</div>
      <div><strong>Vercel commit:</strong> {commit}</div>
      <hr />
      <h3>/api/company?domain=coca-cola.com result (client fetch)</h3>
      {companyResp ? (
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', background: '#f6f6f6', padding: 10 }}>
{`status: ${companyResp.status}
body:
${companyResp.body}`}
        </pre>
      ) : companyErr ? (
        <div style={{ color: 'red' }}>Fetch error: {companyErr}</div>
      ) : (
        <div>Loading company fetch…</div>
      )}
      <hr />
      <p>If this page shows host = "https://www.novahunt.ai" then you are hitting production — open the preview shareable link in an incognito window and paste that shareable URL here. If it shows the vercel.app hostname (or the full shareable link), paste that value and the company fetch block here.</p>
    </div>
  );
}

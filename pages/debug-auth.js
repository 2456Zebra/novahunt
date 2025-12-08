// Temporary diagnostic page — upload (or replace) this file and visit /debug-auth while signed in.
// It prints /api/me, localStorage keys and a couple globals so we can quickly see why your signed-in bar is missing.
import { useEffect, useState } from 'react';

export default function DebugAuth() {
  const [data, setData] = useState({ loading: true });

  useEffect(() => {
    async function run() {
      const out = { loading: false, fetchMe: null, localStorage: {}, globals: {} };

      try {
        const meRes = await fetch('/api/me', { credentials: 'same-origin' });
        out.fetchMe = { status: meRes.status, body: await meRes.text().catch(()=>null) };
      } catch (e) {
        out.fetchMe = { error: String(e) };
      }

      try {
        const keys = ['nh_user_email','nh_usage','nh_last_domain','nh_usage_last_update','nh_usage','nh_user'];
        keys.forEach(k => {
          try { out.localStorage[k] = localStorage.getItem(k); } catch (e) { out.localStorage[k] = `err:${String(e)}`; }
        });
      } catch (e) {
        out.localStorageError = String(e);
      }

      try {
        out.globals = {
          __nh_last_domain: window.__nh_last_domain || null,
          __nh_usage_poll_installed: window.__nh_usage_poll_installed || null,
        };
      } catch (e) {
        out.globalsError = String(e);
      }

      try {
        out.cookies = document.cookie || '';
      } catch (e) {
        out.cookiesError = String(e);
      }

      setData(out);
    }
    run();
  }, []);

  return (
    <main style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Debug: auth & usage</h2>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12, borderRadius: 8 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <p>Open this page while signed in and paste the JSON shown here into the chat.</p>
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

function readSavedContacts() {
  try {
    const raw = localStorage.getItem('novahunt.savedContacts') || '[]';
    return JSON.parse(raw);
  } catch { return []; }
}

export default function Account() {
  const [saved, setSaved] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    try {
      const a = localStorage.getItem('nh_account');
      if (a) setAccount(JSON.parse(a));
      const s = readSavedContacts();
      setSaved(s);
    } catch {
      setAccount(null);
      setSaved([]);
    }
  }, []);

  function unsubscribe() {
    if (!account) return;
    const updated = { ...account, unsubscribed: true };
    localStorage.setItem('nh_account', JSON.stringify(updated));
    setAccount(updated);
    alert('You have been unsubscribed from marketing emails (demo).');
  }

  function signOut() {
    try {
      localStorage.removeItem('nh_isSignedIn');
      // keep account persisted but signed out
    } catch {}
    window.location.href = '/';
  }

  return (
    <div style={{ padding:32, fontFamily:'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>Account</h1>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        { account ? (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700 }}>{account.email}</div>
            <div style={{ color:'#6b7280' }}>Plan: {account.plan} — Searches: {account.searches || 0} — Reveals: {account.reveals || 0}</div>
          </div>
        ) : null }

        { saved && saved.length > 0 ? (
          <>
            <p style={{ color:'#374151' }}>Saved contacts (local demo):</p>
            <div style={{ display:'grid', gap:10 }}>
              {saved.map((c, i) => (
                <div key={i} style={{ background:'#fff', border:'1px solid #e6edf3', padding:12, borderRadius:8 }}>
                  <div style={{ fontWeight:700 }}>{c.first_name} {c.last_name}</div>
                  <div style={{ color:'#6b7280' }}>{c.email}</div>
                  <div style={{ color:'#6b7280', fontSize:13 }}>{c.position}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background:'#fff', border:'1px solid #e6edf3', padding:18, borderRadius:8 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>No account data found.</div>
            <div style={{ color:'#374151', marginBottom:12 }}>It looks like you don't have saved contacts yet or your account data wasn't created. For this demo we persist saved contacts locally.</div>
            <div style={{ display:'flex', gap:8 }}>
              <Link href="/plans"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Choose a plan</a></Link>
              <Link href="/signup"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Create an account</a></Link>
            </div>
          </div>
        )}

        <div style={{ marginTop:18 }}>
          <button onClick={unsubscribe} style={{ background:'#ef4444', color:'#fff', border:'none', padding:'8px 12px', borderRadius:6, cursor:'pointer' }}>Unsubscribe</button>
          <button onClick={signOut} style={{ marginLeft:12, background:'#111827', color:'#fff', border:'none', padding:'8px 12px', borderRadius:6, cursor:'pointer' }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

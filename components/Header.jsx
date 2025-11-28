import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// Site-wide header used in _app.js so nav is consistent across pages.
// Shows Home / Plans / About and SignIn (or account pulldown when signed in).

function getStoredAccount() {
  try {
    const a = localStorage.getItem('nh_account');
    return a ? JSON.parse(a) : null;
  } catch { return null; }
}

export default function Header() {
  const [acct, setAcct] = useState(null);

  useEffect(() => {
    setAcct(getStoredAccount());
    // listen for storage changes in other tabs
    function onStorage() {
      setAcct(getStoredAccount());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function signOut() {
    try {
      localStorage.removeItem('nh_isSignedIn');
      localStorage.removeItem('nh_account');
    } catch {}
    setAcct(null);
    // reload to update UI
    window.location.href = '/';
  }

  return (
    <header style={{ background:'#fff', borderBottom:'1px solid #eef2f7' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <Link href="/"><a style={{ fontWeight:800, fontSize:18, color:'#0a1724', textDecoration:'none' }}>NovaHunt</a></Link>

          <nav style={{ display:'flex', gap:12, alignItems:'center' }}>
            <Link href="/"><a style={{ color:'#2563eb', textDecoration:'none' }}>Home</a></Link>
            <Link href="/plans"><a style={{ color:'#2563eb', textDecoration:'none' }}>Plans</a></Link>
            <Link href="/about"><a style={{ color:'#2563eb', textDecoration:'none' }}>About</a></Link>
          </nav>
        </div>

        <div>
          { !acct ? (
            <div style={{ display:'flex', gap:12 }}>
              <Link href="/signin"><a style={{ color:'#2563eb', textDecoration:'underline' }}>SignIn</a></Link>
              <Link href="/plans"><a style={{ color:'#2563eb', textDecoration:'underline' }}>SignUp</a></Link>
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ fontSize:13 }}>{acct.email}</div>
                <button onClick={() => {
                  const d = document.getElementById('nh-account-dropdown');
                  if (d) d.style.display = d.style.display === 'block' ? 'none' : 'block';
                }} style={{ padding:'6px 8px', borderRadius:6, border:'1px solid #e6edf3', background:'#fff', cursor:'pointer' }}>Account</button>
              </div>

              <div id="nh-account-dropdown" style={{ display:'none', position:'absolute', right:0, top:'44px', background:'#fff', border:'1px solid #e6edf3', borderRadius:6, padding:12, minWidth:240, zIndex:60 }}>
                <div style={{ fontWeight:700, marginBottom:6 }}>{acct.email}</div>
                <div style={{ color:'#6b7280', fontSize:13, marginBottom:8 }}>Plan: {acct.plan || 'Free'}</div>
                <div style={{ color:'#6b7280', fontSize:13, marginBottom:8 }}>Searches: {acct.searches || 0} • Reveals: {acct.reveals || 0}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <Link href="/account"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Account</a></Link>
                  <button onClick={signOut} style={{ background:'transparent', border:'none', color:'#111', cursor:'pointer' }}>Sign out</button>
                </div>
              </div>
            </div>
          ) }
        </div>
      </div>
    </header>
  );
}

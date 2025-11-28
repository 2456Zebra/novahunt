import React, { useEffect, useState } from 'react';
import App from 'next/app';
import ErrorBoundary from '../components/ErrorBoundary';
import Link from 'next/link';

function TopAccount() {
  const [acct, setAcct] = useState(null);

  useEffect(() => {
    try {
      const a = localStorage.getItem('nh_account');
      if (a) setAcct(JSON.parse(a));
    } catch { setAcct(null); }
  }, []);

  function signOut() {
    try {
      localStorage.removeItem('nh_isSignedIn');
      localStorage.removeItem('nh_account');
    } catch {}
    window.location.href = '/';
  }

  if (!acct) {
    return (
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <Link href="/signin"><a style={{ textDecoration:'underline', color:'#2563eb' }}>SignIn</a></Link>
        <Link href="/plans"><a style={{ textDecoration:'underline', color:'#2563eb' }}>SignUp</a></Link>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
      <div style={{ fontSize:13, color:'#0b1220' }}>{acct.email}</div>
      <div style={{ position:'relative' }}>
        <button onClick={() => {
          // toggle simple dropdown
          const d = document.getElementById('nh-account-dropdown');
          if (d) d.style.display = d.style.display === 'block' ? 'none' : 'block';
        }} style={{ padding:'6px 8px', borderRadius:6, border:'1px solid #e6edf3', background:'#fff', cursor:'pointer' }}>Account</button>
        <div id="nh-account-dropdown" style={{ display:'none', position:'absolute', right:0, top:'36px', background:'#fff', border:'1px solid #e6edf3', borderRadius:6, padding:8, minWidth:160 }}>
          <div style={{ marginBottom:8 }}><Link href="/account"><a>Account</a></Link></div>
          <div style={{ marginBottom:8 }}><Link href="/plans"><a>Plans</a></Link></div>
          <div><button onClick={signOut} style={{ background:'transparent', border:'none', color:'#111', cursor:'pointer' }}>Sign out</button></div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ marginTop:40, padding:20, borderTop:'1px solid #e6edf3', background:'#fbfcfd', textAlign:'center', color:'#6b7280', fontSize:13 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>© 2026 NovaHunt</div>
        <div style={{ display:'flex', gap:12 }}>
          <a href="/terms" style={{ color:'#6b7280', textDecoration:'underline' }}>Terms</a>
          <a href="/privacy" style={{ color:'#6b7280', textDecoration:'underline' }}>Privacy</a>
          <a href="/contact" style={{ color:'#6b7280', textDecoration:'underline' }}>Contact</a>
        </div>
      </div>
    </footer>
  );
}

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <ErrorBoundary>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #eef2f7', background:'#fff' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:800 }}>NovaHunt</div>
            <TopAccount />
          </div>
        </div>

        <Component {...pageProps} />
        <Footer />
      </ErrorBoundary>
    );
  }
}

export default MyApp;

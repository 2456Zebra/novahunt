import React, { useState } from 'react';
import Link from 'next/link';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) { alert('Enter your email'); return; }
    // demo: just show a message
    setSent(true);
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', fontFamily:'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ width:480, background:'#fff', borderRadius:10, boxShadow:'0 6px 18px rgba(8,15,29,0.06)', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin:0, fontSize:22 }}>{ sent ? 'Check your inbox' : 'Reset password' }</h2>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        { sent ? (
          <div>
            <p style={{ color:'#374151' }}>We sent instructions to <strong>{email}</strong>. (Demo)</p>
            <div style={{ marginTop:12 }}>
              <Link href="/signin"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Return to Sign in</a></Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display:'block', marginBottom:8, fontSize:13 }}>Enter your email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e6edf3', marginBottom:12 }} />
            <button type="submit" style={{ width:'100%', background:'#2563eb', color:'#fff', padding:'10px', borderRadius:8, border:'none', fontWeight:700 }}>Send reset instructions</button>
          </form>
        )}
      </div>
    </div>
  );
}

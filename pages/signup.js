import React, { useState } from 'react';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { alert('Please enter email and password'); return; }
    setSubmitting(true);

    try {
      // Demo account persisted to localStorage. Replace with real backend in production.
      const account = {
        email,
        password, // demo only — replace with proper hashing/auth in prod
        plan: 'Free',
        searches: 0,
        reveals: 0,
        unsubscribed: false,
        createdAt: Date.now()
      };
      localStorage.setItem('nh_isSignedIn', '1');
      localStorage.setItem('nh_account', JSON.stringify(account));
      // Redirect to homepage signed in
      window.location.href = '/';
    } catch (err) {
      alert('Signup failed (demo).');
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', fontFamily:'Inter, system-ui, -apple-system, "Segoe UI", Roboto' }}>
      <div style={{ width:420, background:'#fff', borderRadius:10, boxShadow:'0 6px 18px rgba(8,15,29,0.06)', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin:0, fontSize:22 }}>Create your NovaHunt account</h2>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display:'block', marginBottom:8, fontSize:13 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e6edf3', marginBottom:12 }} />

          <label style={{ display:'block', marginBottom:8, fontSize:13 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a password" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e6edf3', marginBottom:12 }} />

          <button type="submit" disabled={submitting} style={{ width:'100%', background:'#2563eb', color:'#fff', padding:'10px', borderRadius:8, border:'none', fontWeight:700 }}>
            {submitting ? 'Creating…' : 'Create free account'}
          </button>
        </form>

        <div style={{ marginTop:14, textAlign:'center', color:'#6b7280', fontSize:13 }}>
          Already have an account? <Link href="/signin"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Sign in</a></Link>
        </div>
      </div>
    </div>
  );
}

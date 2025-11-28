import React, { useState } from 'react';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function getStoredAccount() {
    try {
      const a = localStorage.getItem('nh_account');
      return a ? JSON.parse(a) : null;
    } catch { return null; }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const acc = getStoredAccount();
      if (!acc || acc.email !== email || acc.password !== password) {
        alert('Invalid credentials (demo).');
        setLoading(false);
        return;
      }
      // set signed-in flag and redirect to home
      localStorage.setItem('nh_isSignedIn', '1');
      localStorage.setItem('nh_account', JSON.stringify(acc));
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      alert('Sign in failed (demo).');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', fontFamily:'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ width:420, background:'#fff', borderRadius:10, boxShadow:'0 6px 18px rgba(8,15,29,0.06)', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin:0, fontSize:22 }}>Sign in to NovaHunt</h2>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display:'block', marginBottom:8, fontSize:13 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e6edf3', marginBottom:12 }} />

          <label style={{ display:'block', marginBottom:8, fontSize:13 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e6edf3', marginBottom:12 }} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <label style={{ fontSize:13, color:'#6b7280' }}><input type="checkbox" style={{ marginRight:6 }} />Remember me</label>
            <Link href="/set-password"><a style={{ color:'#2563eb', fontSize:13 }}>Forgot?</a></Link>
          </div>

          <button type="submit" style={{ width:'100%', background:'#2563eb', color:'#fff', padding:'10px', borderRadius:8, border:'none', fontWeight:700 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop:14, textAlign:'center', color:'#6b7280', fontSize:13 }}>
          New to NovaHunt? <Link href="/signup"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Create an account</a></Link>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';

export default function SetPassword() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', fontFamily:'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ width:460, background:'#fff', borderRadius:10, boxShadow:'0 6px 18px rgba(8,15,29,0.06)', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin:0, fontSize:22 }}>Set Your Password</h2>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

        <p style={{ marginTop:0, marginBottom:18, color:'#6b7280' }}>Choose a secure password for your account.</p>

        <form onSubmit={(e) => { e.preventDefault(); alert('Password set (demo).'); }}>
          <label style={{ display:'block', marginBottom:8, fontSize:13 }}>New password</label>
          <input type="password" placeholder="New password" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e6edf3', marginBottom:12 }} />

          <label style={{ display:'block', marginBottom:8, fontSize:13 }}>Confirm password</label>
          <input type="password" placeholder="Confirm password" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e6edf3', marginBottom:12 }} />

          <button type="submit" style={{ width:'100%', background:'#2563eb', color:'#fff', padding:'10px', borderRadius:8, border:'none', fontWeight:700 }}>Set password</button>
        </form>
      </div>
    </div>
  );
}

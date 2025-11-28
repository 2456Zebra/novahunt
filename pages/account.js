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

  useEffect(() => {
    try {
      const s = readSavedContacts();
      setSaved(s);
    } catch {
      setSaved([]);
    }
  }, []);

  return (
    <div style={{ padding:32, fontFamily:'Inter, system-ui, -apple-system, \"Segoe UI\", Roboto' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>Account</h1>
          <Link href="/"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Back to homepage</a></Link>
        </div>

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
            <div style={{ color:'#374151', marginBottom:12 }}>It looks like you don't have saved contacts yet or your account data wasn't created. For now we persist saved contacts locally (demo).</div>
            <div style={{ display:'flex', gap:8 }}>
              <Link href="/plans"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Choose a plan</a></Link>
              <Link href="/signup"><a style={{ color:'#2563eb', textDecoration:'underline' }}>Create an account</a></Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

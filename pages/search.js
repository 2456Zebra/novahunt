// pages/search.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Search() {
  const router = useRouter();
  const { domain } = router.query;
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!domain) return;

    // For now, using your HTML example as data
    const stubResults = [
      { name: "Anya Fisher", role: "Senior Director of Corporate Communications", email: "anyafisher@coca-cola.com", department: "communication", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20anya%20fisher%20coca-cola" },
      { name: "Anna Rodzik", role: "Media Director", email: "arodzik@coca-cola.com", department: "communication", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20anna%20rodzik%20coca-cola" },
      { name: "Felix Poh", role: "Vice President of Strategy and Corporate Development", email: "felix.poh@coca-cola.com", department: "executive", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20felix%20poh%20coca-cola" },
      { name: "Priscila Martino", role: "Senior Director of Accounting", email: "priscilamartino@coca-cola.com", department: "finance", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20priscila%20martino%20coca-cola" },
      { name: "Ivy Crawford", role: "Senior Director, Execution", email: "ivycrawford@coca-cola.com", department: "management", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20ivy%20crawford%20coca-cola" },
      { name: "Tina Gutierrez", role: "Director of Program Innovation", email: "tinagutierrez@coca-cola.com", department: "management", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20tina%20gutierrez%20coca-cola" },
      { name: "Mark Mitchell", role: "Director of Cloud Services", email: "markmitchell@coca-cola.com", department: "management", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20mark%20mitchell%20coca-cola" },
      { name: "Jay Jones", role: "Global Director of Procurement", email: "jayjones@coca-cola.com", department: "management", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20jay%20jones%20coca-cola" },
      { name: "Tiffany Stone", role: "Senior Director of Marketing", email: "tiffanystone@coca-cola.com", department: "marketing", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20tiffany%20stone%20coca-cola" },
      { name: "Kimberly Burks", role: "Executive Assistant", email: "kimberlyburks@coca-cola.com", department: "operations", trust: "99%", source: "https://www.google.com/search?q=site:linkedin.com%20kimberly%20burks%20coca-cola" },
    ];

    setResults(stubResults);
  }, [domain]);

  // Group results by department
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.department]) acc[r.department] = [];
    acc[r.department].push(r);
    return acc;
  }, {});

  return (
    <main style={{ padding: '24px' }}>
      <h1>Find business contacts from: {domain}</h1>
      {Object.keys(grouped).map((dept) => (
        <div key={dept} style={{ marginTop: '12px' }}>
          <div style={{ display: 'inline-block', background: '#fff3ee', color: '#7a341f', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', marginBottom: '8px' }}>
            {dept} <span style={{ fontWeight: '500', marginLeft: '8px', color: '#7a341f' }}>({grouped[dept].length})</span>
          </div>
          {grouped[dept].map((r, i) => (
            <div key={i} style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: '700' }}>{r.name}</div>
                  <div style={{ background: '#f3f4f6', color: '#374151', borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>{r.trust} trust</div>
                  <a href={r.source} target="_blank" rel="noreferrer noopener" style={{ color: '#2563eb', fontSize: '13px', marginLeft: '8px' }}>Source</a>
                  <Link href="/plans" style={{ marginLeft: '12px', display: 'inline-block', padding: '6px 10px', borderRadius: '6px', background: '#2563eb', color: '#fff', textDecoration: 'none' }}>Reveal</Link>
                </div>
                <div style={{ marginTop: '6px', color: '#6b7280', fontSize: '13px' }}>{r.role}</div>
                <div style={{ marginTop: '8px', color: '#111', wordBreak: 'break-word' }}>{r.email}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </main>
  );
}

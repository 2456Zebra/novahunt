// pages/search.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Search() {
  const router = useRouter();
  const { domain } = router.query;
  const [results, setResults] = useState([]);

  // Stub: Fetch search results (replace with real API)
  useEffect(() => {
    if (!domain) return;
    // Example: stubbed results
    setResults([
      {
        category: "communication",
        contacts: [
          { name: "Anya Fisher", title: "Senior Director of Corporate Communications", email: "anya@coca-cola.com", trust: 99 },
          { name: "Anna Rodzik", title: "Media Director", email: "arodzik@coca-cola.com", trust: 99 },
        ]
      },
      {
        category: "executive",
        contacts: [
          { name: "Felix Poh", title: "VP Strategy & Corp Dev", email: "felix@coca-cola.com", trust: 99 }
        ]
      }
      // Add more stub categories if needed
    ]);
  }, [domain]);

  const handleReveal = (contact) => {
    // Stub: deduct from account search/reveal totals
    console.log("Reveal clicked for:", contact.name);
    alert(`Revealed ${contact.email}. Deduct from account totals (stub).`);
  };

  if (!domain) return <div>Loading...</div>;

  return (
    <div style={{ padding: "24px" }}>
      <h1>Results for: {domain}</h1>
      <div style={{ marginTop: "20px" }}>
        {results.map((group) => (
          <div key={group.category} style={{ marginBottom: "24px" }}>
            <div style={{ display: "inline-block", background: "#fff3ee", color: "#7a341f", padding: "6px 12px", borderRadius: "8px", fontWeight: "700", marginBottom: "8px" }}>
              {group.category} <span style={{ fontWeight: 500 }}>({group.contacts.length})</span>
            </div>
            {group.contacts.map((c) => (
              <div key={c.email} style={{ padding: "12px", borderBottom: "1px solid #f3f4f6", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ background: "#f3f4f6", color: "#374151", borderRadius: "6px", padding: "2px 8px", fontSize: "12px" }}>{c.trust}% trust</div>
                    </div>
                    <button onClick={() => handleReveal(c)} style={{ padding: "6px 10px", borderRadius: "6px", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>Reveal</button>
                  </div>
                  <div style={{ marginTop: "6px", color: "#6b7280", fontSize: "13px" }}>{c.title}</div>
                  <div style={{ marginTop: "8px", color: "#111", wordBreak: "break-word" }}>{c.email.replace(/.(?=.{2,}@)/g, "*")}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

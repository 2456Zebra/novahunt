import { useState } from "react";

export default function SearchResults({ results }) {
  const [revealed, setRevealed] = useState(new Set());

  const grouped = results.reduce((acc, r) => {
    (acc[r.department || "Other"] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {Object.entries(grouped).map(([dept, items]) => (
        <div key={dept}>
          <h3 className="text-xl font-bold mb-5 flex items-center gap-3">
            <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
            {dept} <span className="text-gray-500 font-normal">({items.length})</span>
          </h3>
          <div className="space-y-4">
            {items.map(r => (
              <div key={r.email} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <div className="font-mono text-gray-700 italic text-sm">
                  {revealed.has(r.email) ? r.email : `${r.email.split("@")[0].slice(0,4)}•••••@${r.email.split("@")[1]}`}
                  <span className="ml-4 text-gray-500">• {r.position}</span>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => window.open(`https://www.google.com/search?q=site:linkedin.com+in+${r.first_name}+${r.last_name}`, "_blank")} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition">
                    Source
                  </button>
                  <button onClick={() => setRevealed(s => {
                    const n = new Set(s);
                    n.has(r.email) ? n.delete(r.email) : n.add(r.email);
                    return n;
                  })} className="px-4 py-2 text-blue-600 font-medium text-sm hover:underline">
                    {revealed.has(r.email) ? "Hide" : "Reveal"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState } from "react";

export default function CompanySearch() {
  const [domain, setDomain] = useState("");

  return (
    <input
      type="text"
      placeholder="Enter company domain (e.g. coca-cola.com)"
      value={domain}
      onChange={(e) => setDomain(e.target.value)}
      className="w-full px-6 py-4 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
    />
  );
}

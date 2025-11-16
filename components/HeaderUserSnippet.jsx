import { useState, useEffect } from 'react';

export default function HeaderUserSnippet({ session }) {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (!session) return;

    const fetchUsage = async () => {
      const res = await fetch('/api/usage', {
        headers: { 'x-nh-session': session }
      });
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    };

    fetchUsage();

    const handleUpdate = () => fetchUsage();
    window.addEventListener('account-usage-updated', handleUpdate);
    return () => window.removeEventListener('account-usage-updated', handleUpdate);
  }, [session]);

  if (!session) return null;

  if (!usage) return <span className="text-gray-500">Loading...</span>;

  return (
    <div className="text-sm">
      <span className="font-medium">{usage.plan.toUpperCase()}</span> — 
      Searches: {usage.searches}/{usage.limits.searches} — 
      Reveals: {usage.reveals}/{usage.limits.reveals}
    </div>
  );
}

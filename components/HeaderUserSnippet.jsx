'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HeaderUserSnippet() {
  const [session, setSession] = useState(null);
  const [usage, setUsage] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('nh_session');
    if (s) setSession(s);
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('nh_session');
    setSession(null);
    setUsage(null);
    window.location.reload();
  };

  if (!session) {
    return (
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-signin'))}
        className="text-blue-600 font-medium hover:underline"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-1 rounded bg-blue-100 text-blue-800 font-medium hover:bg-blue-200"
      >
        {usage ? usage.plan.toUpperCase() : 'PRO'}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="text-sm text-gray-600 mb-3">
            <div>Searches: {usage?.searches || 0}/{usage?.limits.searches || 1000}</div>
            <div>Reveals: {usage?.reveals || 0}/{usage?.limits.reveals || 500}</div>
          </div>
          <div className="border-t pt-3 space-y-2">
            <Link href="/account" className="block text-blue-600 hover:underline">Account Settings</Link>
            <Link href="/upgrade" className="block text-blue-600 hover:underline">Upgrade Plan</Link>
            <button onClick={handleLogout} className="w-full text-left text-red-600 hover:underline">
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

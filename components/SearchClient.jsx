'use client';

import { useState, useEffect } from 'react';

export default function SearchClient() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ all: [], visible: [] });
  const [total, setTotal] = useState(0);
  const [session, setSession] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [revealing, setRevealing] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = localStorage.getItem('nh_session');
    if (s) setSession(s);
  }, []);

  function startProgress() {
    setProgress(6);
    const t = setInterval(() => {
      setProgress(p => {
        const next = Math.min(95, p + (3 + Math.random() * 10));
        if (next >= 95) clearInterval(t);
        return next;
      });
    }, 800);
    return t;
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!domain.trim()) return;
    setError('');
    setResults({ all: [], visible: [] });
    setTotal(0);
    setLoading(true);
    setProgress(0);
    const timer = startProgress();

    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
        cache: 'no-store'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'API failed');

      const all = data.results || [];
      const visible = session ? all : all.slice(0, 3);
      setResults({ all, visible });
      setTotal(data.total || all.length);
      setProgress(100);
      clearInterval(timer);
      setTimeout(() => setProgress(0), 500);
    } catch (err) {
      setError(err.message);
      setProgress(0);
      clearInterval(timer);
    } finally {
      setLoading(false);
    }
  }

  async function handleReveal(idx) {
    if (!session) {
      alert('Please sign in to reveal full emails');
      return;
    }

    if (revealing.includes(idx)) return;
    setRevealing(prev => [...prev, idx]);

    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nh-session': session
        },
        body: JSON.stringify({ index: idx })
      });

      const data = await res.json();

      if (res.status === 401) {
        alert('Session expired. Please sign in again.');
        localStorage.removeItem('nh_session');
        setSession(null);
        return;
      }

      if (res.status === 402) {
        alert('Reveal limit reached for your plan. Please upgrade to see all.');
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Reveal failed');

      setResults(prev => {
        const updated = [...prev.all];
        updated[idx].revealed = true;
        updated[idx].email = data.email;
        return { all: updated, visible: session ? updated : updated.slice(0,

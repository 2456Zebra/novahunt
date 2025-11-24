// pages/index.js
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [domain, setDomain] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!domain) return;
    window.location.href = `/search?domain=${encodeURIComponent(domain)}`;
  };

  return (
    <>
      <Head>
        <title>NovaHunt — Find business contacts</title>
        <meta
          name="description"
          content="Search company domains to find contact emails, names and roles."
        />
      </Head>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e6e6e6', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/">
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#111' }}>NovaHunt</span>
          </Link>
          <nav style={{ display: 'flex', gap: '12px' }}>
            <Link href="/">Home</Link>
            <Link href="/plans">Plans</Link>
            <Link href="/about">About</Link>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: '6px' }}>Sign in</button>
          <Link href="/plans" style={{ padding: '6px 10px', borderRadius: '6px', background: '#111827', color: '#fff', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </header>
      <main style={{ padding: '24px' }}>
        <h1 style={{ marginTop: '20px' }}>Find business contacts from a domain</h1>
        <p style={{ color: '#6b7280' }}>Enter a company website (example: coca-cola.com) and NovaHunt will show public business contacts.</p>
        <form onSubmit={handleSearch} style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
          <input
            placeholder="Enter domain, e.g. coca-cola.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{ flex: 1, padding: '10px' }}
          />
          <button type="submit" style={{ padding: '8px 12px' }}>Search</button>
        </form>
      </main>
    </>
  );
}

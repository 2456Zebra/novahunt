// pages/index.js
import Head from 'next/head';
import React, { useState } from 'react';
import HeroLiveDemo from '../components/HeroLiveDemo';
import RightPanel from '../components/RightPanel';

export default function HomePage() {
  const [selectedDomain, setSelectedDomain] = useState('coca-cola.com');
  const [companyData, setCompanyData] = useState(null);

  // When demo selects a domain, update page-level state so RightPanel can show profile.
  const handleSelectDomain = (domain, company) => {
    setSelectedDomain(domain);
    setCompanyData(company || null);
  };

  return (
    <>
      <Head>
        <title>NovaHunt — Find business emails instantly</title>
        <meta name="description" content="Demo: search company domains and reveal professional emails." />
      </Head>

      <div className="nh-container">
        <header className="nh-header">
          <div>
            <h1 className="nh-logo">NovaHunt</h1>
            <p className="nh-sub">Find business emails instantly. Enter a company domain and get professional email results.</p>
          </div>
        </header>

        <main className="nh-main">
          <section className="nh-left">
            <HeroLiveDemo initial={selectedDomain} onSelectDomain={handleSelectDomain} />
          </section>

          <section className="nh-right">
            <RightPanel domain={selectedDomain} company={companyData} />
          </section>
        </main>

        <footer className="nh-footer">© {new Date().getFullYear()} NovaHunt. Demo only.</footer>
      </div>
    </>
  );
}

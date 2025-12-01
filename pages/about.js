import React from 'react';

export default function AboutPage() {
  return (
    <main
      style={{
        padding: 24,
        maxWidth: 900,
        margin: '0 auto',
        paddingBottom: 160, // increased bottom space only (was 96)
        minHeight: '100vh',
        boxSizing: 'border-box',
        background: '#f7f7f8',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>About NovaHunt</h1>
        <a
          href="/"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #e6e6e6',
            background: '#fff',
            color: '#333',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 13,
            alignSelf: 'center'
          }}
        >
          Back to homepage
        </a>
      </div>

      <p style={{ color: '#444', marginTop: 8 }}>
        NovaHunt helps creatives and small teams find the right contacts to get things done — landing representation, booking gigs, or winning new clients.
      </p>

      <section style={{ marginTop: 18, background: '#fff', border: '1px solid #eee', padding: 18, borderRadius: 8 }}>
        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
          <li style={{ marginBottom: 14 }}>
            <strong>For Models</strong>
            <div style={{ color: '#444' }}>Locate modelling agencies, casting contacts, and booking managers so you can pitch and audition with confidence. <span aria-hidden>👗</span></div>
          </li>

          <li style={{ marginBottom: 14 }}>
            <strong>For Actors</strong>
            <div style={{ color: '#444' }}>Search agents and casting directors to discover auditions and representation opportunities. <span aria-hidden>🎭</span></div>
          </li>

          <li style={{ marginBottom: 14 }}>
            <strong>For Musicians</strong>
            <div style={{ color: '#444' }}>Discover promoters, venues, and booking agents to land shows and grow your audience. <span aria-hidden>🎵</span></div>
          </li>

          <li style={{ marginBottom: 14 }}>
            <strong>For Freelancers &amp; Creatives</strong>
            <div style={{ color: '#444' }}>Locate hiring managers and decision-makers to pitch your services and win work. <span aria-hidden>💼</span></div>
          </li>

          <li style={{ marginBottom: 14 }}>
            <strong>For Photographers</strong>
            <div style={{ color: '#444' }}>Find art directors, magazines and brands that hire photographers for shoots and campaigns. <span aria-hidden>📸</span></div>
          </li>

          <li style={{ marginBottom: 14 }}>
            <strong>For Founders</strong>
            <div style={{ color: '#444' }}>Reach investors, mentors, and partners who can help you grow your idea into a business. <span aria-hidden>🚀</span></div>
          </li>

          <li style={{ marginBottom: 14 }}>
            <strong>For Influencers</strong>
            <div style={{ color: '#444' }}>Find brand PR and sponsorship contacts that can help you land paid collaborations. <span aria-hidden>📣</span></div>
          </li>

          <li style={{ marginBottom: 14 }}>
            <strong>For Sellers</strong>
            <div style={{ color: '#444' }}>Discover the right buyer contacts and procurement leads to accelerate sales. <span aria-hidden>🏷️</span></div>
          </li>

          <li style={{ marginBottom: 0 }}>
            <strong>For Event Planners</strong>
            <div style={{ color: '#444' }}>Locate venue contacts, caterers, and vendors to plan and execute successful events. <span aria-hidden>📋</span></div>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Our promise</h2>
        <p style={{ color: '#444' }}>
          We help you find the right person to contact — fast. The right panel gives friendly context while the left column provides the actionable contacts.
        </p>

        <p style={{ color: '#444', marginTop: 12 }}>
          Sign up and let us help you make your dreams and ambitions come true!
        </p>
      </section>
    </main>
  );
}

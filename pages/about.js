export default function AboutPage() {
  return (
    <main style={{ maxWidth: 900, margin: '48px auto', padding: '24px', paddingBottom: 64 }}>
      <h1>About NovaHunt</h1>

      <p style={{ color: '#374151' }}>
        NovaHunt helps creators and individuals find contact emails so you can turn interest into opportunities.
        Whether you’re an influencer, a model, an actor, or a freelancer on Instagram, we make it easy to
        find the right person to pitch — casting directors, agency reps, or the next brand that needs you.
      </p>

      <h3 style={{ marginTop: 20 }}>Who we help</h3>
      <p style={{ color: '#374151' }}>
        We focus on practical, actionable results for people who want to land bookings, gigs, sponsorships,
        or sales: modelling agencies, talent agents, casting directors, and sales reps.
      </p>

      <h3 style={{ marginTop: 20 }}>How it works</h3>
      <ul style={{ color: '#374151' }}>
        <li>Enter a website (like example.com) to find public contact emails</li>
        <li>See confidence scores and sources (LinkedIn, public pages)</li>
        <li>Reveal full emails inline — no extra forms</li>
      </ul>

      <h3 style={{ marginTop: 20 }}>Contact</h3>
      <p style={{ color: '#374151' }}>
        For issues or billing questions, email support@novahunt.ai.
      </p>

      <div style={{ height: 48 }} />
    </main>
  );
}
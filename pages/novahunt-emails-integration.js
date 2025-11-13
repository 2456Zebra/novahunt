import React, { useState } from 'react';
import ConfidencePill from '../components/ConfidencePill';
import SampleResultsNotice from '../components/SampleResultsNotice';
import UpgradeButton from '../components/UpgradeButton';

export default function NovaHuntEmailsIntegration() {
  // mock results for demo/testing — replace with real search results
  const mockResults = {
    totalFound: 444,
    items: [
      { email: 'info@coca-cola.com', name: '', title: 'General', score: 85 },
      { email: 'contact@coca-cola.com', name: '', title: 'General', score: 85 },
      { email: 'press@coca-cola.com', name: '', title: 'General', score: 85 },
      // more items would be hidden in a sample view
    ],
  };

  const [showAll, setShowAll] = useState(false);

  const shownCount = showAll ? mockResults.items.length : Math.min(3, mockResults.items.length);

  return (
    <main style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>NovaHunt Emails</h1>
      <p>Find business emails fast. Confidence scores 85%–100%.</p>

      <SampleResultsNotice shownCount={shownCount} totalFound={mockResults.totalFound} />

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Title</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {mockResults.items.slice(0, shownCount).map((r) => (
            <tr key={r.email} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{r.email}</td>
              <td style={{ padding: '8px' }}>{r.name}</td>
              <td style={{ padding: '8px' }}>{r.title}</td>
              <td style={{ padding: '8px' }}><ConfidencePill minScore={r.score} maxScore={100} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '16px' }}>
        <UpgradeButton onReveal={() => setShowAll(true)} />
      </div>

      {showAll && (
        <div style={{ marginTop: '16px', color: '#0a0' }}>
          <strong>Full results revealed.</strong>
        </div>
      )}
    </main>
  );
}
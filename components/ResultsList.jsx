// components/ResultsList.jsx
import React from 'react';
import ResultItem from './ResultItem';

export default function ResultsList({ contacts = [] }) {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return <div className="nh-empty">No contacts found yet.</div>;
  }

  return (
    <div className="nh-results" role="list">
      {contacts.map((c, i) => (
        <ResultItem key={c.email || `${c.name}-${i}`} contact={c} />
      ))}
    </div>
  );
}

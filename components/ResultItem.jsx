import React from 'react';

export default function ResultItem({ result, onSelect }) {
  return (
    <div 
      style={{ padding: 12, borderBottom: '1px solid #E5E7EB', cursor: 'pointer' }} 
      onClick={onSelect}
    >
      <p style={{ margin: 0, fontWeight: 500 }}>{result.name}</p>
      <p style={{ margin: 0, color: '#6B7280' }}>{result.email}</p>
      <p style={{ margin: 0, fontSize: 12 }}>{result.role}</p>
    </div>
  );
}

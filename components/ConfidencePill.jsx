import React from 'react';

/**
 * ConfidencePill
 * Displays a confidence range like "85%–100%".
 * Ensures a "%" is appended to both bounds even if the values come in as numbers.
 */
export default function ConfidencePill({ minScore, maxScore, className = '' }) {
  const format = (v) => {
    if (v == null || v === '') return '';
    const s = String(v).trim();
    return s.endsWith('%') ? s : `${s}%`;
  };

  const display = `${format(minScore)}–${format(maxScore)}`;

  return (
    <span className={`confidence-pill ${className}`} aria-label={`Confidence ${display}`}> 
      {display}
    </span>
  );
}

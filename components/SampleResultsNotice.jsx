import React from 'react';

/**
 * SampleResultsNotice
 * Props:
 * - shownCount: number of sample items shown (e.g. 3)
 * - totalFound: total number found (e.g. 444)
 *
 * Renders:
 * "Showing sample results for 3 of 444 found. Upgrade to see all 441."
 * Falls back to "Showing sample results." when totalFound is not provided.
 */
export default function SampleResultsNotice({ shownCount = 3, totalFound = 0, className = '' }) {
  const remaining = Math.max(0, totalFound - shownCount);
  return (
    <div className={`sample-results-notice ${className}`} aria-live="polite">
      {totalFound > 0 ? (
        <div>
          Showing sample results for {shownCount} of {totalFound} found. Upgrade to see all {remaining}.
        </div>
      ) : (
        <div>Showing sample results.</div>
      )}
    </div>
  );
}

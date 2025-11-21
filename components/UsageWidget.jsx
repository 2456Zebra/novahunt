import React from 'react';
import Link from 'next/link';

/**
 * UsageWidget: use next/link for internal navigation to satisfy Next.js lint.
 */
export default function UsageWidget({ usage = {}, limit = {} }) {
  return (
    <div className="usage-widget">
      <div>
        Usage: {usage.searchesUsed || 0} of {usage.searchesTotal || '—'}
      </div>

      <div>
        Need more?{' '}
        <Link href="/upgrade/">
          <a>Upgrade</a>
        </Link>
      </div>
    </div>
  );
}

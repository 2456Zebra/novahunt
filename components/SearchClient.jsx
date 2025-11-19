'use client';

// Temporary safe SearchClient shim to avoid React runtime error #130.
// Exports both a default placeholder component (so pages expecting default won't crash)
// and the SignInHintIfAnonymous helper for use in results UI.
//
// Replace this with the full SearchClient implementation (from your previous commit) when ready.

export function SignInHintIfAnonymous() {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('nh_session');
  if (session) return null;
  return (
    <div style={{ color: '#f97316', marginTop: 8, fontWeight: 600 }}>
      Sign in to see all results
    </div>
  );
}

export default function SearchClient() {
  // Minimal placeholder so homepage renders. Replace with real SearchClient implementation.
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Find contacts</h2>
        <p style={{ color: '#374151' }}>
          The search UI is temporarily disabled while we restore the full Copilot search widget.
        </p>
        <div style={{ marginTop: 16 }}>
          <a href="/signup" style={{ padding: '8px 12px', background: '#007bff', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
            Sign up to get started
          </a>
        </div>
      </div>
    </main>
  );
}

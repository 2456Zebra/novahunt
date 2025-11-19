// Sign-in hint helper — include this near the results in your SearchClient rendering
'use client';

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

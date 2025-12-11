// utils/auth.js — client helpers to call the auth endpoints and manage local session
// Keep the shape: localStorage item 'nh_session' === JSON.stringify({ token, email })
// and localStorage 'nh_usage' === JSON.stringify({ searchesUsed, searchesTotal, revealsUsed, revealsTotal })

const DEFAULT_USAGE = { searchesUsed: 0, searchesTotal: 5, revealsUsed: 0, revealsTotal: 2 };

export async function signIn({ email, password }) {
  const res = await fetch('/api/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || 'Signin failed');
  if (body.session && body.session.token) {
    try {
      localStorage.setItem('nh_session', JSON.stringify({ token: body.session.token, email: body.email }));
      const serverUsage = body.usage || null;
      localStorage.setItem('nh_usage', JSON.stringify(serverUsage || DEFAULT_USAGE));
      window.dispatchEvent(new CustomEvent('account-usage-updated'));
      try { window.dispatchEvent(new CustomEvent('nh-signed-in')); } catch (e) {}
    } catch (e) {}
  }
  return body;
}

export async function signUp({ email, password }) {
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || 'Signup failed');
  if (body.session && body.session.token) {
    try {
      localStorage.setItem('nh_session', JSON.stringify({ token: body.session.token, email: body.email }));
      const serverUsage = body.usage || null;
      localStorage.setItem('nh_usage', JSON.stringify(serverUsage || DEFAULT_USAGE));
      window.dispatchEvent(new CustomEvent('account-usage-updated'));
      try { window.dispatchEvent(new CustomEvent('nh-signed-in')); } catch (e) {}
    } catch (e) {}
  }
  return body;
}

export function signOut() {
  try {
    localStorage.removeItem('nh_session');
    localStorage.removeItem('nh_usage');
    fetch('/api/signout', { method: 'POST' }).catch(() => {});
    window.dispatchEvent(new CustomEvent('account-usage-updated'));
  } catch (e) {}
}

export function getLocalSession() {
  try {
    const s = localStorage.getItem('nh_session');
    if (!s) return null;
    return JSON.parse(s);
  } catch (e) { return null; }
}

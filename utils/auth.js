// utils/auth.js
export async function signIn({ email, password }) {
  const res = await fetch('/api/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || 'Signin failed');
  if (body.session && body.session.token) {
    try {
      localStorage.setItem('nh_session', JSON.stringify({ token: body.session.token, email: body.email }));
      window.dispatchEvent(new CustomEvent('account-usage-updated'));
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
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || 'Signup failed');
  if (body.session && body.session.token) {
    try {
      localStorage.setItem('nh_session', JSON.stringify({ token: body.session.token, email: body.email }));
      window.dispatchEvent(new CustomEvent('account-usage-updated'));
    } catch (e) {}
  }
  return body;
}

export function signOut() {
  try {
    localStorage.removeItem('nh_session');
    fetch('/api/signout', { method: 'POST' }).catch(() => {});
    window.dispatchEvent(new CustomEvent('account-usage-updated'));
    location.reload();
  } catch (e) {}
}

export function getLocalSession() {
  try {
    const s = localStorage.getItem('nh_session');
    if (!s) return null;
    return JSON.parse(s);
  } catch (e) { return null; }
}

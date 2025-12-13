// pages/api/auth/set-cookie.js
// Sets HttpOnly sb-access-token and sb-refresh-token cookies so server middleware
// can detect the authenticated session after a client sign-in.
//
// Expected POST body JSON: { access_token, refresh_token, expires_at }
// - access_token, refresh_token: strings (tokens returned by supabase client auth session)
// - expires_at: unix seconds (optional) - used to compute Max-Age
//
// Security notes:
// - Accepts POST only.
// - Intended to be called same-origin immediately after a client sign-in (fetch with credentials: 'same-origin').
// - Cookies set are HttpOnly, Secure, SameSite=None and Domain=.novahunt.ai (when not localhost).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const body = req.body || {};
    const { access_token, refresh_token, expires_at } = body;

    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: 'Missing tokens' });
    }

    // Host extraction (strip port)
    const hostHeader = (req.headers.host || '').split(':')[0] || '';
    const isLocal = hostHeader.includes('localhost') || hostHeader.startsWith('127.') || hostHeader === '';

    // For non-localhost, set cookie domain to top-level (leading dot) so cookies work on www and root
    let cookieDomain;
    if (!isLocal && hostHeader) {
      cookieDomain = '.' + hostHeader.replace(/^www\./i, '');
    }

    // Compute Max-Age: default to 30 days when expires_at not provided.
    const now = Math.floor(Date.now() / 1000);
    const defaultMaxAge = 60 * 60 * 24 * 30;
    let maxAge = defaultMaxAge;
    if (typeof expires_at === 'number' && expires_at > now) {
      maxAge = Math.max(60, expires_at - now);
    }

    // Cookie attributes: Use SameSite=None and Secure so cross-site redirects (Stripe → site) will still allow setting/using cookies.
    // SameSite=None requires Secure (HTTPS). For localhost we omit Domain and still set Secure if served over HTTPS.
    const attrs = [
      'Path=/',
      `Max-Age=${Math.floor(maxAge)}`,
      'HttpOnly',
      'Secure',
      'SameSite=None',
    ];
    if (cookieDomain) attrs.push(`Domain=${cookieDomain}`);

    // Safely encode token values for cookie transport
    const at = encodeURIComponent(String(access_token));
    const rt = encodeURIComponent(String(refresh_token));

    const setCookies = [
      `sb-access-token=${at}; ${attrs.join('; ')}`,
      `sb-refresh-token=${rt}; ${attrs.join('; ')}`,
    ];

    // Set the cookies (multiple Set-Cookie headers)
    res.setHeader('Set-Cookie', setCookies);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('set-cookie error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}

// pages/api/auth/set-cookie.js
// Accepts POST { access_token, refresh_token, expires_at }
// Sets HttpOnly cookies: sb-access-token, sb-refresh-token
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { access_token, refresh_token, expires_at } = req.body || {};
    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: 'Missing tokens' });
    }

    // determine host -> domain behavior
    const hostHeader = (req.headers.host || '').split(':')[0] || '';
    const isLocal = hostHeader.includes('localhost') || hostHeader.startsWith('127.') || hostHeader === '';

    // compute Max-Age
    const now = Math.floor(Date.now() / 1000);
    const defaultMaxAge = 60 * 60 * 24 * 30; // 30 days
    let maxAge = defaultMaxAge;
    if (typeof expires_at === 'number' && expires_at > now) {
      maxAge = Math.max(60, expires_at - now);
    }

    // cookie attributes
    const attrs = [
      'Path=/',
      `Max-Age=${Math.floor(maxAge)}`,
      'HttpOnly',
      'Secure',
      'SameSite=None',
    ];
    // For non-localhost set Domain=.yourdomain
    if (!isLocal && hostHeader) {
      const topDomain = '.' + hostHeader.replace(/^www\./i, '');
      attrs.push(`Domain=${topDomain}`);
    }

    const at = encodeURIComponent(String(access_token));
    const rt = encodeURIComponent(String(refresh_token));

    const cookies = [
      `sb-access-token=${at}; ${attrs.join('; ')}`,
      `sb-refresh-token=${rt}; ${attrs.join('; ')}`,
    ];

    res.setHeader('Set-Cookie', cookies);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('set-cookie error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}

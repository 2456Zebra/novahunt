// DEBUG: disabled in production
// This used to reveal KV keys for an email. Disabled now to avoid leaking internal data.
export default async function handler(req, res) {
  return res.status(410).json({ ok: false, error: 'Debug KV inspector disabled. Use internal admin tooling only.' });
}

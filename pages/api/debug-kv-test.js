// DEBUG: disabled in production
// Safeguard endpoint — removed to avoid accidental exposure.
export default async function handler(req, res) {
  return res.status(410).json({ ok: false, error: 'Debug KV test disabled. Remove this file only for emergency debugging.' });
}

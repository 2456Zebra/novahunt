// DEBUG: disabled in production
// This endpoint previously allowed injecting debug KV data. It has been disabled for safety.
// If you need to run it again, restore the original file temporarily and use a short-lived DEBUG_SECRET.
export default async function handler(req, res) {
  // If DEBUG_SECRET is present and matches, you could allow operations — but for safety we block by default.
  return res.status(410).json({ ok: false, error: 'Debug injector disabled. Remove this file only for emergency debug and rotate DEBUG_SECRET.' });
}

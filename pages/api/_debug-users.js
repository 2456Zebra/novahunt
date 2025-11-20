// Temporary debug endpoint: returns the user-store contents
// IMPORTANT: set DEBUG_SECRET in Vercel to a random value before using.
// Usage: curl -H "x-debug-secret: <value>" https://<your-deploy>/api/_debug-users
// Remove this file after debugging.

const fs = require('fs');
const path = require('path');

const STORE_PATH = process.env.NH_USER_STORE_PATH || path.join('/tmp', 'novahunt-users.json');

export default async function handler(req, res) {
  const secret = req.headers['x-debug-secret'] || '';
  if (!process.env.DEBUG_SECRET || secret !== process.env.DEBUG_SECRET) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    if (!fs.existsSync(STORE_PATH)) {
      return res.status(200).json({ ok: true, users: [], storePath: STORE_PATH });
    }
    const raw = await fs.promises.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw || '{"users":[]}');
    // Don't leak password hashes unless you explicitly need them - we will show them only if DEBUG_SHOW_HASHES env var is true
    const showHashes = !!process.env.DEBUG_SHOW_HASHES;
    const users = (parsed.users || []).map(u => {
      return showHashes ? u : { id: u.id, email: u.email, createdAt: u.createdAt, metadata: u.metadata || {}, usage: u.usage || null };
    });
    return res.status(200).json({ ok: true, users, storePath: STORE_PATH });
  } catch (err) {
    console.error('debug-users error', err && (err.message || err));
    return res.status(500).json({ ok: false, error: 'server error', details: String(err && err.message) });
  }
}

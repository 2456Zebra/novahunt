// Protected test endpoint to verify KV reads/writes across serverless functions.
// POST {} or POST { email: "user@example.com" }
// Header: x-debug-secret must equal process.env.DEBUG_SECRET
// Returns whether kv exists, test write/read results, and a read of stripe:subscription:{email} if provided.
import { getKV } from './_kv-wrapper';
const kv = getKV();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const secret = req.headers['x-debug-secret'] || '';
  if (!process.env.DEBUG_SECRET) {
    return res.status(403).json({ error: 'Debug endpoint not enabled (no DEBUG_SECRET configured)' });
  }
  if (!secret || secret !== process.env.DEBUG_SECRET) {
    return res.status(401).json({ error: 'Missing or invalid debug secret' });
  }

  try {
    if (!kv) {
      return res.status(200).json({ ok: true, kvAvailable: false, note: 'getKV returned null/undefined' });
    }

    // Create a short unique key and write/read it
    const ts = Date.now();
    const testKey = `debug:test:${ts}`;
    const testVal = `ping-${ts}`;

    let writeOk = false;
    let readBack = null;
    let writeError = null;

    try {
      await kv.set(testKey, testVal, { ex: 60 }); // expire quickly
      writeOk = true;
    } catch (e) {
      writeError = String(e?.message || e);
    }

    try {
      readBack = await kv.get(testKey);
    } catch (e) {
      if (!readBack) readBack = `read error: ${String(e?.message || e)}`;
    }

    // Optionally read stripe:subscription:{email}
    const { email } = req.body || {};
    let subscriptionRead = null;
    if (email) {
      try {
        subscriptionRead = await kv.get(`stripe:subscription:${String(email).toLowerCase()}`);
      } catch (e) {
        subscriptionRead = `read error: ${String(e?.message || e)}`;
      }
    }

    return res.status(200).json({
      ok: true,
      kvAvailable: true,
      testKey,
      testVal,
      writeOk,
      writeError,
      readBack,
      subscriptionRead,
    });
  } catch (err) {
    console.error('debug-kv-test error', err?.message || err);
    return res.status(500).json({ error: 'Server error', detail: String(err?.message || err) });
  }
}

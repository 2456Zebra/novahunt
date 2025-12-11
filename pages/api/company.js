import fs from 'fs';
import path from 'path';

/*
  Minimal company API for production.

  - GET /api/company?domain=example.com
  - Serves data/<domain>.json if present: returns { ok: true, company: <json> }
  - If missing, returns 404.
  - Deterministic and safe (no external calls).
*/

export default function handler(req, res) {
  const { domain } = req.query || {};

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ ok: false, error: 'domain query parameter is required' });
  }

  const d = domain.trim().toLowerCase();

  // Prevent path traversal
  if (d.includes('..') || d.includes('/') || d.includes('\\')) {
    return res.status(400).json({ ok: false, error: 'invalid domain' });
  }

  const dataPath = path.join(process.cwd(), 'data', `${d}.json`);

  try {
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ ok: false, error: 'company not found' });
    }

    const raw = fs.readFileSync(dataPath, 'utf8');
    const company = JSON.parse(raw);

    return res.status(200).json({ ok: true, company });
  } catch (err) {
    console.error('company API error', err);
    return res.status(500).json({ ok: false, error: 'internal error' });
  }
}

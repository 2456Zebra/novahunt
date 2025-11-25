import fs from 'fs';
import path from 'path';

/*
  Simple company info API.

  Behavior:
  - Expects query param: ?domain=example.com
  - Looks for a seeded JSON file at /data/<domain>.json and returns it as { company: <file> }.
  - If not found, returns 404.
  - This is intentionally deterministic and avoids external network calls so it is safe to deploy to production.
*/

export default function handler(req, res) {
  const { domain } = req.query || {};

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ ok: false, error: 'domain query parameter is required' });
  }

  // Normalize domain to lower-case and trim
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

    // Return a stable shape expected by the client
    return res.status(200).json({ ok: true, company });
  } catch (err) {
    console.error('company API error', err);
    return res.status(500).json({ ok: false, error: 'internal error' });
  }
}

import axios from 'axios';

export default async function handler(req, res) {
  const { domain } = req.query || {};
  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ ok: false, error: 'domain query parameter is required' });
  }

  const hunterKey = process.env.HUNTER_API_KEY;
  const hunterDebug = { tried: false, ok: false, statusCode: null, error: null };

  if (!hunterKey) {
    hunterDebug.error = 'HUNTER_API_KEY not set';
    return res.status(500).json({ ok: false, hunterDebug });
  }

  hunterDebug.tried = true;

  try {
    const pageSize = parseInt(process.env.HUNTER_PAGE_SIZE || '10', 10);
    const resp = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: { domain, api_key: hunterKey, limit: pageSize },
      timeout: 10000,
    });

    hunterDebug.statusCode = resp.status;

    const emails = (resp.data && resp.data.data && resp.data.data.emails) || [];

    const maskEmail = (email) => {
      if (!email) return '';
      const [local, d] = email.split('@');
      if (!local || !d) return email;
      const first = local.charAt(0);
      const last = local.charAt(local.length - 1);
      const stars = '*'.repeat(Math.max(3, local.length - 2));
      return `${first}${stars}${last}@${d}`;
    };

    const items = emails.map((e) => ({
      name: e.first_name || e.last_name ? `${e.first_name || ''} ${e.last_name || ''}`.trim() : null,
      title: e.position || null,
      department: null,
      confidence: typeof e.confidence !== 'undefined' ? Number(e.confidence) : null,
      source: 'hunter',
      email: e.value || null,
      maskedEmail: maskEmail(e.value || ''),
      raw: e,
    }));

    hunterDebug.ok = true;
    return res.status(200).json({ ok: true, items, total: items.length, hunterDebug });
  } catch (err) {
    hunterDebug.error = err.message || String(err);
    if (err.response) hunterDebug.statusCode = err.response.status;
    console.error('hunter-debug error', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, items: [], total: 0, hunterDebug });
  }
}

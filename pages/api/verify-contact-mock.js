// Mock email verifier. Simply returns valid for alex.smith@<domain> and invalid otherwise.
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });

  const lower = (email || '').toLowerCase();
  const isAlex = lower.startsWith('alex.smith@');

  const payload = {
    data: {
      data: {
        email: lower,
        status: isAlex ? 'valid' : 'invalid',
        result: isAlex ? 'deliverable' : 'undeliverable'
      }
    }
  };

  return res.status(200).json(payload);
}
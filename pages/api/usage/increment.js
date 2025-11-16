import { getSession } from '../../../lib/auth';
import { incrementUsage } from '../../../lib/usage';

export default async function handler(req, res) {
  const sessionHeader = req.headers['x-nh-session'];
  if (!sessionHeader) return res.status(401).end();

  const session = await getSession(sessionHeader);
  if (!session?.email) return res.status(401).end();

  const { type } = req.body;
  if (!['searches', 'reveals'].includes(type)) return res.status(400).end();

  const result = await incrementUsage(session.email, type);
  res.json(result);
}

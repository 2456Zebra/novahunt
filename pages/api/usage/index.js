import { getSession } from '../../../lib/auth';
import { getUsage } from '../../../lib/usage';

export default async function handler(req, res) {
  const sessionHeader = req.headers['x-nh-session'];
  if (!sessionHeader) return res.status(401).end();

  const session = await getSession(sessionHeader);
  if (!session?.email) return res.status(401).end();

  const usage = await getUsage(session.email);
  res.json(usage);
}

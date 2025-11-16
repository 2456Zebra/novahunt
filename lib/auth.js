import { createClient } from '@upstash/redis';

const redis = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getSession(sessionToken) {
  if (!sessionToken) return null;
  const session = await redis.get(`session:${sessionToken}`);
  if (!session) return null;
  return session;
}

export async function createSession(email, plan = 'free') {
  const token = Math.random().toString(36).slice(2);
  await redis.set(`session:${token}`, { email, plan }, { ex: 60 * 60 * 24 * 30 }); // 30 days
  return token;
}

export async function deleteSession(token) {
  await redis.del(`session:${token}`);
}

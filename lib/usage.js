import { createClient } from '@upstash/redis';

const redis = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const limits = {
  free: { searches: 5, reveals: 2 },
  starter: { searches: 100, reveals: 100 },
  pro: { searches: 1000, reveals: 500 },
  team: { searches: 2000, reveals: 2000 },
};

export async function incrementUsage(email, type) {
  const plan = await getPlan(email);
  const key = `usage:${email}:${type}`;
  const count = await redis.incr(key);
  const limit = limits[plan]?.[type] || 0;
  if (count > limit) {
    await redis.decr(key);
    return { over: true, limit };
  }
  return { count, limit };
}

export async function getUsage(email) {
  const plan = await getPlan(email);
  const searches = Number(await redis.get(`usage:${email}:searches`) || 0);
  const reveals = Number(await redis.get(`usage:${email}:reveals`) || 0);
  return {
    plan,
    searches,
    reveals,
    limits: limits[plan] || limits.free,
  };
}

async function getPlan(email) {
  const sub = await redis.get(`sub:${email}`);
  return sub?.plan || 'free';
}

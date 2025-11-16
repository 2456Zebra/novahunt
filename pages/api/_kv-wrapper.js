// Safe KV wrapper — Upstash-aware and adds incr support for atomic counters.
// Priority:
// 1) If KV_REST_API_URL && KV_REST_API_TOKEN are set, attempt to load @vercel/kv and return it.
// 2) Else if UPSTASH_REST_URL/UPSTASH_REDIS_REST_URL && UPSTASH_REST_TOKEN/UPSTASH_REDIS_REST_TOKEN are set, return an Upstash-backed wrapper.
// 3) Otherwise return an in-memory fallback (non-persistent).
export function getKV() {
  // 1) Try Vercel KV if env vars present
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      // require dynamically so module import won't fail when not installed
      // eslint-disable-next-line global-require
      const kvModule = require('@vercel/kv');
      if (kvModule && kvModule.kv) return kvModule.kv;
      if (kvModule && typeof kvModule.default !== 'undefined') return kvModule.default;
    } catch (err) {
      console.warn('Could not load @vercel/kv even though KV envs set:', err?.message || err);
      // fallthrough to other options
    }
  }

  // Helper to find Upstash env variants
  const upstashUrl = process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_RESTURL || null;
  const upstashToken = process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_RESTTOKEN || null;

  // 2) Try Upstash Redis (REST) if configured
  if (upstashUrl && upstashToken) {
    try {
      // Use @upstash/redis REST client
      // eslint-disable-next-line global-require
      const { Redis } = require('@upstash/redis');
      const redis = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });

      // Normalize get/set/del/incr signatures to accept objects (JSON) and strings
      return {
        get: async (key) => {
          try {
            const v = await redis.get(key);
            if (v === null || typeof v === 'undefined') return null;
            if (typeof v === 'string') {
              try {
                return JSON.parse(v);
              } catch (_) {
                return v;
              }
            }
            return v;
          } catch (e) {
            console.warn('Upstash get error', e?.message || e);
            return null;
          }
        },

        set: async (key, value, opts) => {
          try {
            const storeVal = (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') ? value : JSON.stringify(value);
            if (opts && opts.ex) {
              // redis.setex expects seconds
              await redis.setex(key, opts.ex, storeVal);
            } else {
              await redis.set(key, storeVal);
            }
            return true;
          } catch (e) {
            console.warn('Upstash set error', e?.message || e);
            return false;
          }
        },

        del: async (key) => {
          try {
            await redis.del(key);
            return true;
          } catch (e) {
            console.warn('Upstash del error', e?.message || e);
            return false;
          }
        },

        incr: async (key, by = 1) => {
          try {
            // Upstash supports INCRBY via redis.incrby
            if (by === 1) {
              const val = await redis.incr(key);
              return parseInt(val || '0', 10);
            } else {
              const val = await redis.incrby(key, by);
              return parseInt(val || '0', 10);
            }
          } catch (e) {
            console.warn('Upstash incr error', e?.message || e);
            // fallback: read/parse/set
            try {
              const cur = await redis.get(key);
              const n = parseInt(cur || '0', 10) || 0;
              const next = n + by;
              await redis.set(key, String(next));
              return next;
            } catch (e2) {
              console.warn('Upstash incr fallback failed', e2?.message || e2);
              return null;
            }
          }
        },

        keys: async (pattern = '*') => {
          try {
            const res = [];
            let cursor = 0;
            do {
              const scan = await redis.scan(cursor, { match: pattern, count: 100 });
              cursor = scan[0];
              const keys = scan[1] || [];
              res.push(...keys);
            } while (cursor !== 0 && cursor !== '0');
            return res;
          } catch (e) {
            console.warn('Upstash keys error', e?.message || e);
            return [];
          }
        },
      };
    } catch (err) {
      console.warn('Could not load @upstash/redis even though UPSTASH envs set:', err?.message || err);
      // fallthrough to in-memory fallback
    }
  }

  // 3) In-memory fallback. Not persistent across instances/restarts.
  const store = new Map();

  return {
    get: async (key) => {
      try {
        if (store.has(key)) return store.get(key);
        return null;
      } catch (e) {
        return null;
      }
    },

    set: async (key, value, opts) => {
      try {
        store.set(key, value);
        return true;
      } catch (e) {
        return false;
      }
    },

    del: async (key) => {
      try {
        store.delete(key);
        return true;
      } catch (e) {
        return false;
      }
    },

    incr: async (key, by = 1) => {
      try {
        const cur = store.has(key) ? parseInt(store.get(key) || '0', 10) : 0;
        const next = cur + by;
        store.set(key, next);
        return next;
      } catch (e) {
        return null;
      }
    },

    keys: async () => Array.from(store.keys()),
  };
}

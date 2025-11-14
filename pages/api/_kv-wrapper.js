// Safe KV wrapper — returns a working kv-like API.
// - If KV_REST_API_URL and KV_REST_API_TOKEN are set and @vercel/kv loads, returns real kv.
// - Otherwise returns a lightweight in-memory fallback with async get/set/del methods.
// Place this file at pages/api/_kv-wrapper.js and import it from your API routes.
//
// Usage in pages/api/*.js (example):
// import { getKV } from './_kv-wrapper';
// const kv = getKV();
export function getKV() {
  // If KV envs exist, try to dynamically require @vercel/kv
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      // require dynamically so module load doesn't fail when envs are absent
      // eslint-disable-next-line global-require
      const kvModule = require('@vercel/kv');
      if (kvModule && kvModule.kv) return kvModule.kv;
      // fallback if kv export shape differs
      if (kvModule && typeof kvModule.default !== 'undefined') return kvModule.default;
    } catch (err) {
      console.warn('Could not load @vercel/kv even though KV envs set:', err?.message || err);
      // fall through to in-memory fallback
    }
  }

  // In-memory fallback. Not persistent across instances/restarts.
  const store = new Map();

  return {
    // get: returns null if missing (to mimic @vercel/kv behavior)
    get: async (key) => {
      try {
        if (store.has(key)) return store.get(key);
        return null;
      } catch (e) {
        return null;
      }
    },

    // set: optionally accept opts (ex TTL)
    set: async (key, value, opts) => {
      try {
        store.set(key, value);
        // ignore opts (ttl) in fallback
        return true;
      } catch (e) {
        return false;
      }
    },

    // del / delete
    del: async (key) => {
      try {
        store.delete(key);
        return true;
      } catch (e) {
        return false;
      }
    },

    // keys (for debugging; not required)
    keys: async () => Array.from(store.keys()),
  };
}

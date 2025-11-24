// pages/api/_kv-wrapper.js
// Temporary stub to allow build without @vercel/kv

// If you later add Vercel KV, you can replace this stub

export function getKV() {
  // This is a no-op stub
  console.warn("KV access is stubbed. No data will be stored or fetched.");
  return {
    get: async () => null,
    set: async () => {},
    del: async () => {},
  };
}

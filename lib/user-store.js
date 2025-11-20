// lib/user-store.js — file-backed user store with PBKDF2 password hashing
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH = process.env.NH_USER_STORE_PATH || path.join('/tmp', 'novahunt-users.json');
const PBKDF2_ITERATIONS = parseInt(process.env.NH_PBKDF2_ITERS || '100000', 10);
const KEYLEN = 64;
const DIGEST = 'sha256';

// Usage limits
const DEFAULT_SEARCHES_TOTAL = 5;
const DEFAULT_REVEALS_TOTAL = 2;

function ensureStoreFileSync() {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify({ users: [] }, null, 2), { mode: 0o600 });
  } catch (e) {
    console.warn('user-store ensure error', e?.message || e);
  }
}

async function readStore() {
  try {
    ensureStoreFileSync();
    const raw = await fs.promises.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw || '{"users":[]}');
  } catch (e) {
    console.error('readStore error', e?.message || e);
    return { users: [] };
  }
}

async function writeStore(data) {
  try {
    await fs.promises.writeFile(STORE_PATH, JSON.stringify(data, null, 2), { mode: 0o600 });
    return true;
  } catch (e) {
    console.error('writeStore error', e?.message || e);
    return false;
  }
}

function hashPassword(password, salt, iterations = PBKDF2_ITERATIONS) {
  const derived = crypto.pbkdf2Sync(String(password), Buffer.from(salt, 'base64'), iterations, KEYLEN, DIGEST);
  return derived.toString('base64');
}

async function getUserByEmail(email) {
  if (!email) return null;
  const normalized = String(email).toLowerCase().trim();
  const store = await readStore();
  return store.users.find(u => u.email === normalized) || null;
}

async function createUser({ email, password, metadata = {} }) {
  if (!email || !password) throw new Error('email and password required');
  const normalized = String(email).toLowerCase().trim();
  const existing = await getUserByEmail(normalized);
  if (existing) throw new Error('user_exists');

  const salt = crypto.randomBytes(16).toString('base64');
  const iterations = PBKDF2_ITERATIONS;
  const passwordHash = hashPassword(password, salt, iterations);
  const id = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex');
  const now = new Date().toISOString();
  const user = {
    id,
    email: normalized,
    passwordHash,
    salt,
    iterations,
    createdAt: now,
    metadata,
    usage: { searchesUsed: 0, searchesTotal: DEFAULT_SEARCHES_TOTAL, revealsUsed: 0, revealsTotal: DEFAULT_REVEALS_TOTAL }
  };

  const store = await readStore();
  store.users.push(user);
  const ok = await writeStore(store);
  if (!ok) throw new Error('persist_failed');
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

async function verifyPasswordForUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return false;
  try {
    const expected = hashPassword(password, user.salt, user.iterations || PBKDF2_ITERATIONS);
    const a = Buffer.from(expected, 'base64');
    const b = Buffer.from(user.passwordHash, 'base64');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    console.error('verifyPassword error', e?.message || e);
    return false;
  }
}

async function getUsageForUser(userId) {
  if (!userId) return null;
  const user = await getUserById(userId);
  if (!user) return null;
  // Return usage or default if not present
  return user.usage || { searchesUsed: 0, searchesTotal: DEFAULT_SEARCHES_TOTAL, revealsUsed: 0, revealsTotal: DEFAULT_REVEALS_TOTAL };
}

async function incrementUsage(userId, { searches = 0, reveals = 0 }) {
  if (!userId) throw new Error('userId required');
  const store = await readStore();
  const userIndex = store.users.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error('user_not_found');
  
  const user = store.users[userIndex];
  // Initialize usage if not present
  if (!user.usage) {
    user.usage = { searchesUsed: 0, searchesTotal: DEFAULT_SEARCHES_TOTAL, revealsUsed: 0, revealsTotal: DEFAULT_REVEALS_TOTAL };
  }
  
  // Increment usage, ensuring we don't exceed totals
  if (searches > 0) {
    user.usage.searchesUsed = Math.min(
      user.usage.searchesTotal,
      (user.usage.searchesUsed || 0) + searches
    );
  }
  if (reveals > 0) {
    user.usage.revealsUsed = Math.min(
      user.usage.revealsTotal,
      (user.usage.revealsUsed || 0) + reveals
    );
  }
  
  const ok = await writeStore(store);
  if (!ok) throw new Error('persist_failed');
  return user.usage;
}

async function getUserById(id) {
  const store = await readStore();
  return store.users.find(u => u.id === id) || null;
}

module.exports = {
  getUserByEmail,
  createUser,
  verifyPasswordForUser,
  getUserById,
  getUsageForUser,
  incrementUsage
};

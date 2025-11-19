// lib/user-store.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH = process.env.NH_USER_STORE_PATH || path.join('/tmp', 'novahunt-users.json');
const PBKDF2_ITERATIONS = parseInt(process.env.NH_PBKDF2_ITERS || '100000', 10);
const KEYLEN = 64;
const DIGEST = 'sha256';

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
    metadata
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

module.exports = {
  getUserByEmail,
  createUser,
  verifyPasswordForUser,
  getUserById: async (id) => {
    const store = await readStore();
    return store.users.find(u => u.id === id) || null;
  }
};

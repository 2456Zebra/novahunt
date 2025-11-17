import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const STORE_PATH = process.env.NH_USER_STORE_PATH || path.join('/tmp', 'novahunt-users.json');

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const s = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(s || '[]');
  } catch (e) {
    console.warn('user-store read error', e && e.message ? e.message : e);
    return [];
  }
}

function writeStore(data) {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('user-store write error', e && e.message ? e.message : e);
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyHash(stored, password) {
  try {
    const [salt, hash] = stored.split(':');
    const derived = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
  } catch (e) {
    return false;
  }
}

export async function getUserByEmail(email) {
  const store = readStore();
  return store.find(u => u.email === email) || null;
}

export async function createUserWithPassword(email, password) {
  if (!email) throw new Error('email required');
  const store = readStore();
  const existing = store.find(u => u.email === email);
  if (existing) throw new Error('already_exists');

  const user = {
    id: uuidv4(),
    email,
    hashedPassword: password ? hashPassword(password) : null,
    created_at: Date.now(),
    sessions: [],
    usage: { searches: 0, reveals: 0 }
  };
  store.push(user);
  writeStore(store);
  return user;
}

export async function setPasswordForUser(email, password) {
  const store = readStore();
  const idx = store.findIndex(u => u.email === email);
  if (idx === -1) throw new Error('not_found');
  store[idx].hashedPassword = hashPassword(password);
  writeStore(store);
  return store[idx];
}

export async function verifyPasswordForUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user || !user.hashedPassword) return false;
  return verifyHash(user.hashedPassword, password);
}

export async function createSessionForUser(email) {
  const store = readStore();
  const idx = store.findIndex(u => u.email === email);
  if (idx === -1) throw new Error('not_found');
  const token = uuidv4();
  const entry = { token, created_at: Date.now() };
  store[idx].sessions = store[idx].sessions || [];
  store[idx].sessions.push(entry);
  writeStore(store);
  return token;
}

export async function getUserBySession(token) {
  if (!token) return null;
  const store = readStore();
  const user = store.find(u => (u.sessions || []).some(s => s.token === token));
  return user || null;
}

export async function incrementUsage(email, type = 'search', amount = 1) {
  const store = readStore();
  const idx = store.findIndex(u => u.email === email);
  if (idx === -1) return null;
  store[idx].usage = store[idx].usage || { searches: 0, reveals: 0 };
  if (type === 'search') store[idx].usage.searches = (store[idx].usage.searches || 0) + amount;
  if (type === 'reveal') store[idx].usage.reveals = (store[idx].usage.reveals || 0) + amount;
  writeStore(store);
  return store[idx].usage;
}
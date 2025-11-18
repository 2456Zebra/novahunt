import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import crypto from "crypto";
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.resolve(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]), "utf8");
}

function readUsers() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error("Failed to read users.json:", err);
    return [];
  }
}

function writeUsers(users) {
  ensureDataFile();
  const tmp = USERS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2), "utf8");
  fs.renameSync(tmp, USERS_FILE);
}

// Old crypto-based hashing (for backward compatibility)
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

// NextAuth-compatible functions (new API)
export async function findUserByEmail(email) {
  const users = readUsers();
  return users.find(u => u.email === email) || null;
}

export async function createUser(email, passwordHash, name = "") {
  const users = readUsers();
  const id = randomUUID();
  const user = { id, email, passwordHash, name };
  users.push(user);
  writeUsers(users);
  return user;
}

// Backward-compatible functions (old API)
export async function getUserByEmail(email) {
  return findUserByEmail(email);
}

export async function createUserWithPassword(email, password) {
  if (!email) throw new Error('email required');
  const users = readUsers();
  const existing = users.find(u => u.email === email);
  if (existing) throw new Error('already_exists');

  const user = {
    id: uuidv4(),
    email,
    hashedPassword: password ? hashPassword(password) : null,
    created_at: Date.now(),
    sessions: [],
    usage: { searches: 0, reveals: 0 }
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export async function setPasswordForUser(email, password) {
  const users = readUsers();
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) throw new Error('not_found');
  users[idx].hashedPassword = hashPassword(password);
  writeUsers(users);
  return users[idx];
}

export async function verifyPasswordForUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user || !user.hashedPassword) return false;
  return verifyHash(user.hashedPassword, password);
}

export async function createSessionForUser(email) {
  const users = readUsers();
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) throw new Error('not_found');
  const token = uuidv4();
  const entry = { token, created_at: Date.now() };
  users[idx].sessions = users[idx].sessions || [];
  users[idx].sessions.push(entry);
  writeUsers(users);
  return token;
}

export async function getUserBySession(token) {
  if (!token) return null;
  const users = readUsers();
  const user = users.find(u => (u.sessions || []).some(s => s.token === token));
  return user || null;
}

export async function incrementUsage(email, type = 'search', amount = 1) {
  const users = readUsers();
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) return null;
  users[idx].usage = users[idx].usage || { searches: 0, reveals: 0 };
  if (type === 'search') users[idx].usage.searches = (users[idx].usage.searches || 0) + amount;
  if (type === 'reveal') users[idx].usage.reveals = (users[idx].usage.reveals || 0) + amount;
  writeUsers(users);
  return users[idx].usage;
}

const userStore = { findUserByEmail, createUser };
export default userStore;

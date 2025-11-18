const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
  if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, '{}', 'utf8');
}

function readUsers() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
  } catch (e) {
    return [];
  }
}

function writeUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function readSessions() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8') || '{}');
  } catch (e) {
    return {};
  }
}

function writeSessions(sessions) {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

module.exports = {
  // Return user object or null
  async getUserByEmail(email) {
    const e = normalizeEmail(email);
    const users = readUsers();
    return users.find(u => u.email === e) || null;
  },

  // Create a user: returns created user object
  // userData: { email, password }
  async createUser({ email, password }) {
    const e = normalizeEmail(email);
    if (!e || !password) throw new Error('email and password required');
    const users = readUsers();
    if (users.find(u => u.email === e)) {
      const err = new Error('User exists');
      err.code = 'exists';
      throw err;
    }
    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    const user = { id, email: e, passwordHash: hash, createdAt: now, updatedAt: now };
    users.push(user);
    writeUsers(users);
    // Don't return passwordHash to callers in normal flows; return minimal info
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  },

  // Verify password: returns true/false
  async verifyPasswordForUser(email, password) {
    const u = await this.getUserByEmail(email);
    if (!u) return false;
    return bcrypt.compareSync(password, u.passwordHash);
  },

  // Create a session for a user (accepts either user object or {email})
  // Returns { token, userId, expiresAt }
  async createSessionForUser(userOrEmail) {
    const email = typeof userOrEmail === 'string' ? userOrEmail : (userOrEmail?.email);
    const u = await this.getUserByEmail(email);
    if (!u) throw new Error('user-not-found');
    const sessions = readSessions();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
    sessions[token] = { userId: u.id, email: u.email, createdAt: Date.now(), expiresAt };
    writeSessions(sessions);
    return { token, userId: u.id, expiresAt };
  },

  // Optional: lookup session token
  async getSessionByToken(token) {
    const sessions = readSessions();
    const s = sessions[token];
    if (!s) return null;
    if (s.expiresAt && Date.now() > s.expiresAt) {
      // expired - clean up
      delete sessions[token];
      writeSessions(sessions);
      return null;
    }
    return s;
  },

  // For admin/test: list users (do not expose in production)
  async listUsers() {
    return readUsers().map(u => ({ id: u.id, email: u.email, createdAt: u.createdAt }));
  }
};

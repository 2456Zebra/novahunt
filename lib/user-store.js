import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

export async function getOrCreateUserByEmail(email) {
  if (!email) throw new Error('email required');
  const store = readStore();
  const existing = store.find(u => u.email === email);
  if (existing) return existing;

  const user = {
    id: uuidv4(),
    email,
    created_at: Date.now(),
  };
  store.push(user);
  writeStore(store);
  return user;
}
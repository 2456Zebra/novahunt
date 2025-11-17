import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TRACK_PATH = process.env.NH_TRACK_PATH || path.join('/tmp', 'novahunt-tracking.jsonl');

export async function appendEvent({ userId = null, eventType, payload = {}, ip = null }) {
  const entry = {
    id: uuidv4(),
    ts: Date.now(),
    userId,
    eventType,
    payload,
    ip,
  };

  try {
    fs.mkdirSync(path.dirname(TRACK_PATH), { recursive: true });
    fs.appendFileSync(TRACK_PATH, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
  } catch (e) {
    console.warn('appendEvent error', e && e.message ? e.message : e);
  }
  return entry;
}
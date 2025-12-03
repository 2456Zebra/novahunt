// lib/disposableEmails.js
// Minimal list of common disposable/throwaway email domains.
// You can expand this list over time or replace with an external blocklist service.
// Exported as a Set for fast lookup.
const domains = [
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'tempmail.com',
  'tempmail.net',
  'dispostable.com',
  'yopmail.com',
  'maildrop.cc',
  'fakeinbox.com',
  'spamgourmet.com',
  'mailnesia.com',
  'throwawaymail.com',
  'getnada.com',
  'sharklasers.com',
  'mintemail.com',
  'spamherelots.com',
  'disposablemail.com',
  'mailcatch.com',
  'dropmail.me',
  'mail-temporaire.fr',
];

const set = new Set(domains.map(d => d.toLowerCase()));
export default set;

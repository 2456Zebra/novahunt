// Minimal client-side auth/limits helpers used by pages/index.js.
// Non-sensitive, purely client-side; stores counters in localStorage/sessionStorage.

const REVEAL_LIMIT = 3;
const SEARCH_LIMIT = 20;

export function getClientEmail() {
  try {
    return localStorage.getItem('nh_client_email') || null;
  } catch (e) {
    return null;
  }
}

export function canReveal() {
  try {
    const count = Number(localStorage.getItem('nh_reveal_count') || 0);
    return count < REVEAL_LIMIT;
  } catch (e) {
    return false;
  }
}

export function incrementReveal() {
  try {
    const cur = Number(localStorage.getItem('nh_reveal_count') || 0);
    if (cur >= REVEAL_LIMIT) return false;
    localStorage.setItem('nh_reveal_count', String(cur + 1));
    return true;
  } catch (e) {
    return false;
  }
}

export function recordReveal(entry) {
  try {
    const raw = localStorage.getItem('novahunt.reveals') || '[]';
    const arr = JSON.parse(raw);
    arr.push(entry);
    localStorage.setItem('novahunt.reveals', JSON.stringify(arr));
  } catch (e) {
    // ignore
  }
}

export function canSearch() {
  try {
    const count = Number(localStorage.getItem('nh_search_count') || 0);
    return count < SEARCH_LIMIT;
  } catch (e) {
    return false;
  }
}

export function incrementSearch() {
  try {
    const cur = Number(localStorage.getItem('nh_search_count') || 0);
    if (cur >= SEARCH_LIMIT) return false;
    localStorage.setItem('nh_search_count', String(cur + 1));
    return true;
  } catch (e) {
    return false;
  }
}

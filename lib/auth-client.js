// Client-side auth helpers (lib/auth-client.js)
// - Normalizes usage objects stored in localStorage
// - Ensures plan-defaults are applied
// - Clears local reveal history when a new user signs in so different users don't see each other's reveals
// - Dispatches events so UI updates immediately in the same tab

const PLAN_DEFAULTS = {
  free: { limitSearches: 5, limitReveals: 3 },
  starter: { limitSearches: 100, limitReveals: 50 },
};

function applyPlanDefaults(obj) {
  try {
    const plan = (obj && obj.plan) || null;
    if (!plan) return obj;
    const defaults = PLAN_DEFAULTS[plan];
    if (!defaults) return obj;
    return {
      ...obj,
      limitSearches: Math.max(Number(obj.limitSearches ?? defaults.limitSearches), Number(defaults.limitSearches)),
      limitReveals: Math.max(Number(obj.limitReveals ?? defaults.limitReveals), Number(defaults.limitReveals)),
      plan,
    };
  } catch (e) {
    return obj;
  }
}

export function normalizeUsage(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const u = parsed || {};
    if (!u.plan) u.plan = 'free';

    if (typeof u.searches === 'number' || typeof u.reveals === 'number') {
      const out = {
        searches: Number(u.searches || 0),
        reveals: Number(u.reveals || 0),
        limitSearches: Number(u.limitSearches ?? u.searches ?? 0),
        limitReveals: Number(u.limitReveals ?? u.reveals ?? 0),
        plan: u.plan || null,
      };
      return applyPlanDefaults(out);
    }

    if (typeof u.searchesUsed === 'number' || typeof u.searchesTotal === 'number' || typeof u.revealsUsed === 'number' || typeof u.revealsTotal === 'number') {
      const out = {
        searches: Number(u.searchesUsed || 0),
        reveals: Number(u.revealsUsed || 0),
        limitSearches: Number(u.searchesTotal ?? u.limitSearches ?? 0),
        limitReveals: Number(u.revealsTotal ?? u.limitReveals ?? 0),
        plan: u.plan || null,
      };
      return applyPlanDefaults(out);
    }

    const out = {
      searches: Number(u.searches || u.searchesUsed || 0),
      reveals: Number(u.reveals || u.revealsUsed || 0),
      limitSearches: Number(u.limitSearches || u.searchesTotal || 0),
      limitReveals: Number(u.limitReveals || u.revealsTotal || 0),
      plan: u.plan || null,
    };
    return applyPlanDefaults(out);
  } catch (e) {
    return null;
  }
}

export function getClientEmail() {
  try { return localStorage.getItem('nh_user_email'); } catch (e) { return null; }
}

export function getClientUsageRaw() {
  try { return localStorage.getItem('nh_usage'); } catch (e) { return null; }
}

export function getClientUsage() {
  try {
    const raw = getClientUsageRaw();
    return normalizeUsage(raw) || { searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null };
  } catch (e) {
    return { searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null };
  }
}

function dispatchClientEvent(name, detail = null) {
  try {
    if (typeof window !== 'undefined') {
      const ev = detail ? new CustomEvent(name, { detail }) : new Event(name);
      window.dispatchEvent(ev);
    }
  } catch (e) { /* ignore */ }
}

export function setClientSignedIn(email, usage = null) {
  try {
    const prev = localStorage.getItem('nh_user_email');
    localStorage.setItem('nh_user_email', String(email || ''));

    if (usage) {
      const copy = (typeof usage === 'string') ? JSON.parse(usage) : { ...usage };
      if (!copy.plan) copy.plan = 'free';
      const normalized = normalizeUsage(copy) || copy;
      localStorage.setItem('nh_usage', JSON.stringify(normalized));
    } else if (!localStorage.getItem('nh_usage')) {
      localStorage.setItem('nh_usage', JSON.stringify({ plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 }));
    }

    // Reset reveal history when a DIFFERENT user signs in to avoid leaking prior user's history
    try {
      if (!prev || prev !== email) {
        localStorage.setItem('nh_reveals', JSON.stringify([]));
      }
    } catch (e) {}

    localStorage.setItem('nh_usage_last_update', Date.now().toString());
    dispatchClientEvent('nh_auth_changed');
    dispatchClientEvent('nh_usage_updated');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('setClientSignedIn failed', e);
  }
}

export function clearClientSignedIn() {
  try {
    localStorage.removeItem('nh_user_email');
    localStorage.removeItem('nh_usage');
    localStorage.removeItem('nh_usage_last_update');
    // Do NOT remove nh_reveals on sign-out — user intent may be to keep local reveals. Only clear on signin change.
    dispatchClientEvent('nh_auth_changed');
    dispatchClientEvent('nh_usage_updated');
  } catch (e) {}
}

export function recordReveal(record) {
  try {
    const raw = localStorage.getItem('nh_reveals') || '[]';
    const arr = JSON.parse(raw);
    arr.unshift(record);
    if (arr.length > 200) arr.length = 200;
    localStorage.setItem('nh_reveals', JSON.stringify(arr));
    dispatchClientEvent('nh_reveals_updated');
  } catch (e) {}
}

export function getRevealHistory() {
  try {
    const raw = localStorage.getItem('nh_reveals');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function updateClientUsage(updater) {
  try {
    const raw = getClientUsageRaw();
    const usage = normalizeUsage(raw) || { searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null };
    const next = updater(usage);
    const final = normalizeUsage(next) || next;
    localStorage.setItem('nh_usage', JSON.stringify(final));
    localStorage.setItem('nh_usage_last_update', Date.now().toString());
    dispatchClientEvent('nh_usage_updated');
    return final;
  } catch (e) {
    return null;
  }
}

export function incrementReveal() {
  return updateClientUsage((u) => ({ ...u, reveals: Number(u.reveals || 0) + 1 }));
}

export function incrementSearch() {
  return updateClientUsage((u) => ({ ...u, searches: Number(u.searches || 0) + 1 }));
}

export function canReveal() {
  const u = getClientUsage();
  if (typeof u.reveals !== 'number' || typeof u.limitReveals !== 'number') return false;
  return u.reveals < u.limitReveals;
}

export function canSearch() {
  const u = getClientUsage();
  if (typeof u.searches !== 'number' || typeof u.limitSearches !== 'number') return false;
  return u.searches < u.limitSearches;
}

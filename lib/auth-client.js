// Client-side auth helpers (lib/auth-client.js)
// - Normalizes usage objects stored in localStorage
// - Provides helpers to set/clear the same client markers other parts of the app expect
// - Provides small policy checks (canSearch/canReveal)
// - Applies plan defaults and enforces minimums so a "free" account always has expected limits
// - Dispatches events so UI updates immediately in the same tab

const PLAN_DEFAULTS = {
  free: { limitSearches: 5, limitReveals: 3 },
  starter: { limitSearches: 100, limitReveals: 50 },
  // add other plans here as needed
};

function applyPlanDefaults(obj) {
  try {
    const plan = (obj && obj.plan) || null;
    if (!plan) return obj;
    const defaults = PLAN_DEFAULTS[plan];
    if (!defaults) return obj;
    // enforce minimum limits: server cannot lower below plan defaults on the client
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

    // IMPORTANT: treat a missing plan as 'free' (sanitizes legacy server shapes)
    // This ensures plan-default limits (e.g. free => 3 reveals) are applied even if the server returned legacy keys.
    if (!u.plan) {
      u.plan = 'free';
    }

    // New shape
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
    // Old shape
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
    // Fallback
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
  try {
    return localStorage.getItem('nh_user_email');
  } catch (e) {
    return null;
  }
}

export function getClientUsageRaw() {
  try {
    return localStorage.getItem('nh_usage');
  } catch (e) {
    return null;
  }
}

export function getClientUsage() {
  try {
    const raw = getClientUsageRaw();
    const normalized = normalizeUsage(raw);
    if (normalized) return normalized;
    // fallback -> treat as free user defaults (prevents accidental zero-limits)
    return { plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 };
  } catch (e) {
    return { plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 };
  }
}

function dispatchClientEvent(name) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(name));
    }
  } catch (e) {
    // ignore
  }
}

export function setClientSignedIn(email, usage = null) {
  try {
    // canonical email marker
    localStorage.setItem('nh_user_email', String(email || ''));

    // legacy boolean marker used by older code paths
    try { localStorage.setItem('nh_isSignedIn', '1'); } catch (e) {}

    if (usage) {
      const usageCopy = (typeof usage === 'string') ? JSON.parse(usage) : { ...usage };
      if (!usageCopy.plan) usageCopy.plan = 'free';
      const normalized = normalizeUsage(usageCopy) || usageCopy;
      localStorage.setItem('nh_usage', JSON.stringify(normalized));
    } else if (!localStorage.getItem('nh_usage')) {
      // default for new signups
      localStorage.setItem('nh_usage', JSON.stringify({ plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 }));
    }

    localStorage.setItem('nh_usage_last_update', Date.now().toString());
    dispatchClientEvent('nh_auth_changed');
    dispatchClientEvent('nh_usage_updated');
  } catch (e) {
    console.warn('setClientSignedIn failed', e);
  }
}

export function clearClientSignedIn() {
  try {
    localStorage.removeItem('nh_user_email');
    localStorage.removeItem('nh_usage');
    localStorage.removeItem('nh_usage_last_update');
    // remove legacy marker too
    try { localStorage.removeItem('nh_isSignedIn'); } catch (e) {}
    dispatchClientEvent('nh_auth_changed');
    dispatchClientEvent('nh_usage_updated');
  } catch (e) {
    // ignore
  }
}

export function recordReveal(record) {
  try {
    const raw = localStorage.getItem('nh_reveals') || '[]';
    const arr = JSON.parse(raw);
    arr.unshift(record);
    if (arr.length > 200) arr.length = 200;
    localStorage.setItem('nh_reveals', JSON.stringify(arr));
    dispatchClientEvent('nh_reveals_updated');
  } catch (e) {
    // ignore
  }
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
    const usage = normalizeUsage(raw) || { plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 };
    const next = updater(usage);
    const final = normalizeUsage(finalize(next)) || next;

    // ensure final is normalized - reuse normalizeUsage but guard
    function finalize(u) {
      try { return u; } catch (e) { return usage; }
    }

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

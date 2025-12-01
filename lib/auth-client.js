// Client-side auth helpers (lib/auth-client.js)
// - Normalizes usage objects stored in localStorage
// - Provides helpers to set/clear the same client markers other parts of the app expect
// - Provides small policy checks (canSearch/canReveal) used by UI to avoid redirecting signed-in users to Plans
// - Applies plan defaults so a "free" account always has the expected limits (5 searches / 3 reveals)
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
    return {
      ...defaults,
      ...obj,
      limitSearches: (obj.limitSearches ?? defaults.limitSearches),
      limitReveals: (obj.limitReveals ?? defaults.limitReveals),
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
    if (typeof u.searchesUsed === 'number' || typeof u.searchesTotal === 'number') {
      const out = {
        searches: Number(u.searchesUsed || 0),
        reveals: Number(u.revealsUsed || 0),
        limitSearches: Number(u.searchesTotal || 0),
        limitReveals: Number(u.revealsTotal || 0),
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
    return normalizeUsage(raw) || { searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null };
  } catch (e) {
    return { searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null };
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
    localStorage.setItem('nh_user_email', String(email || ''));
    if (usage) {
      // Ensure plan defaults are applied before persisting
      const normalized = normalizeUsage(usage) || usage;
      localStorage.setItem('nh_usage', JSON.stringify(normalized));
    } else if (!localStorage.getItem('nh_usage')) {
      // conservative Free defaults
      localStorage.setItem('nh_usage', JSON.stringify({ plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 }));
    }
    localStorage.setItem('nh_usage_last_update', Date.now().toString());
    // notify in-tab listeners
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
    // notify
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
    // notify
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

// Update the client-side usage object in localStorage and dispatch an event so in-tab UI updates immediately
function updateClientUsage(updater) {
  try {
    const raw = getClientUsageRaw();
    const usage = normalizeUsage(raw) || { searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null };
    const next = updater(usage);
    // ensure plan defaults if next has a plan
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
  return updateClientUsage((u) => {
    return {
      ...u,
      reveals: Number(u.reveals || 0) + 1,
    };
  });
}

export function incrementSearch() {
  return updateClientUsage((u) => {
    return {
      ...u,
      searches: Number(u.searches || 0) + 1,
    };
  });
}

// Policy helpers
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

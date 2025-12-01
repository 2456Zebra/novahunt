// Client-side auth helpers (lib/auth-client.js)
// - Normalizes usage objects stored in localStorage
// - Provides helpers to set/clear the same client markers other parts of the app expect
// - Provides small policy checks (canSearch/canReveal) used by UI to avoid redirecting signed-in users to Plans
// - Provides increment helpers used after a successful reveal/search to keep client state in sync
//
// Keys used in localStorage:
// - nh_user_email
// - nh_usage   (JSON string; supports multiple shapes)
// - nh_usage_last_update
// - nh_reveals (optional) an array of reveal records performed by the client

export function normalizeUsage(raw) {
  if (!raw) return null;
  try {
    const u = typeof raw === 'string' ? JSON.parse(raw) : raw;
    // New shape
    if (typeof u.searches === 'number' || typeof u.reveals === 'number') {
      return {
        searches: Number(u.searches || 0),
        reveals: Number(u.reveals || 0),
        limitSearches: Number(u.limitSearches ?? u.searches ?? 0),
        limitReveals: Number(u.limitReveals ?? u.reveals ?? 0),
        plan: u.plan || null,
      };
    }
    // Old shape
    if (typeof u.searchesUsed === 'number' || typeof u.searchesTotal === 'number') {
      return {
        searches: Number(u.searchesUsed || 0),
        reveals: Number(u.revealsUsed || 0),
        limitSearches: Number(u.searchesTotal || 0),
        limitReveals: Number(u.revealsTotal || 0),
        plan: u.plan || null,
      };
    }
    // Fallback
    return {
      searches: Number(u.searches || u.searchesUsed || 0),
      reveals: Number(u.reveals || u.revealsUsed || 0),
      limitSearches: Number(u.limitSearches || u.searchesTotal || 0),
      limitReveals: Number(u.limitReveals || u.revealsTotal || 0),
      plan: u.plan || null,
    };
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

export function setClientSignedIn(email, usage = null) {
  try {
    localStorage.setItem('nh_user_email', String(email || ''));
    if (usage) {
      localStorage.setItem('nh_usage', JSON.stringify(usage));
    } else if (!localStorage.getItem('nh_usage')) {
      // conservative Free defaults
      localStorage.setItem('nh_usage', JSON.stringify({ plan: 'free', searches: 0, reveals: 0, limitSearches: 5, limitReveals: 3 }));
    }
    localStorage.setItem('nh_usage_last_update', Date.now().toString());
  } catch (e) {
    // ignore
    // eslint-disable-next-line no-console
    console.warn('setClientSignedIn failed', e);
  }
}

export function clearClientSignedIn() {
  try {
    localStorage.removeItem('nh_user_email');
    localStorage.removeItem('nh_usage');
    localStorage.removeItem('nh_usage_last_update');
    // optional: keep reveal history
    // localStorage.removeItem('nh_reveals');
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

// Update the client-side usage object in localStorage
function updateClientUsage(updater) {
  try {
    const raw = getClientUsageRaw();
    const usage = normalizeUsage(raw) || { searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0, plan: null };
    const next = updater(usage);
    localStorage.setItem('nh_usage', JSON.stringify(next));
    localStorage.setItem('nh_usage_last_update', Date.now().toString());
    return next;
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

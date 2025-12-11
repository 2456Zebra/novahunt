// Lightweight localStorage-based usage management.
// Reads/writes nh_usage in localStorage and provides helpers to check & consume searches/reveals.

const PLAN_DEFAULTS = {
  free: { limitSearches: 5, limitReveals: 3 },
  starter: { limitSearches: 100, limitReveals: 50 },
  pro: { limitSearches: 1000, limitReveals: 500 },
  enterprise: { limitSearches: 3000, limitReveals: 1500 },
};

function readRaw() {
  try {
    const raw = localStorage.getItem('nh_usage');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeRaw(obj) {
  try {
    localStorage.setItem('nh_usage', JSON.stringify(obj));
    // small trigger for other tabs/components
    try { localStorage.setItem('nh_usage_last_update', Date.now().toString()); } catch (e) {}
    return true;
  } catch (e) {
    return false;
  }
}

export function ensureUsageForPlan(planKey = 'free') {
  const cur = readRaw();
  if (cur && cur.plan) return cur;
  const defaults = PLAN_DEFAULTS[planKey] || PLAN_DEFAULTS.free;
  const usage = {
    searches: 0,
    reveals: 0,
    limitSearches: defaults.limitSearches,
    limitReveals: defaults.limitReveals,
    plan: planKey,
  };
  writeRaw(usage);
  return usage;
}

export function getUsage() {
  return readRaw() || ensureUsageForPlan('free');
}

export function canUseSearch(count = 1) {
  const u = getUsage();
  return (u.searches + count) <= (u.limitSearches || 0);
}

export function useSearch(count = 1) {
  const u = getUsage();
  if ((u.searches + count) > (u.limitSearches || 0)) return false;
  u.searches = (u.searches || 0) + count;
  writeRaw(u);
  return true;
}

export function canUseReveal(count = 1) {
  const u = getUsage();
  return (u.reveals + count) <= (u.limitReveals || 0);
}

export function useReveal(count = 1) {
  const u = getUsage();
  if ((u.reveals + count) > (u.limitReveals || 0)) return false;
  u.reveals = (u.reveals || 0) + count;
  writeRaw(u);
  return true;
}

export function setUsage(newUsage = {}) {
  const current = getUsage();
  const merged = { ...current, ...newUsage };
  writeRaw(merged);
  return merged;
}

export function setPlanByPriceId(priceId) {
  // helper: if you want to map price id to plan, implement mapping here.
  // For now no-op; you already map priceId server-side on success and set nh_usage there.
  return getUsage();
}

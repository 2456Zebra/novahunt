// public/nh-temp-header.js
// Client-only temporary header that reads nh_user_email and nh_usage from localStorage.
// Place this file in public/ and include it on every page via a <script src="/nh-temp-header.js" defer></script> tag.
//
// Behavior:
// - Shows a small fixed header box with email, usage counts, Account (link) and Logout button.
// - Listens to localStorage 'storage' events and to changes (poll fallback) so it updates after signup redirect.
// - Logout clears the same localStorage keys used by signup/signin and reloads the page.
// - Non-destructive and independent of your React app.

(function () {
  if (typeof window === 'undefined') return;
  if (document.getElementById('nh-temp-header')) return; // already injected

  function safeParse(json) {
    try { return JSON.parse(json); } catch (e) { return null; }
  }

  function normalizeUsageObj(u) {
    if (!u) return { searches: 0, reveals: 0, limitSearches: 0, limitReveals: 0 };
    // new shape
    if (typeof u.searches === 'number' || typeof u.reveals === 'number') {
      return {
        searches: u.searches || 0,
        reveals: u.reveals || 0,
        limitSearches: u.limitSearches || (u.searches ?? 0),
        limitReveals: u.limitReveals || (u.reveals ?? 0)
      };
    }
    // old shape
    if (typeof u.searchesUsed === 'number' || typeof u.searchesTotal === 'number') {
      return {
        searches: u.searchesUsed || 0,
        reveals: u.revealsUsed || 0,
        limitSearches: u.searchesTotal || 0,
        limitReveals: u.revealsTotal || 0
      };
    }
    return {
      searches: (u.searches || u.searchesUsed || 0),
      reveals: (u.reveals || u.revealsUsed || 0),
      limitSearches: (u.limitSearches || u.searchesTotal || 0),
      limitReveals: (u.limitReveals || u.revealsTotal || 0)
    };
  }

  function readState() {
    const email = localStorage.getItem('nh_user_email');
    const raw = localStorage.getItem('nh_usage');
    const usage = normalizeUsageObj(safeParse(raw));
    return { email, usage };
  }

  function buildHtml(email, usage) {
    return (
      '<div class="nh-email">' + (email || 'Not signed in') + '</div>' +
      '<div class="nh-usage">' +
        '<div>Searches: <strong>' + (usage.searches || 0) + '</strong> / ' + (usage.limitSearches || 0) + '</div>' +
        '<div>Reveals: <strong>' + (usage.reveals || 0) + '</strong> / ' + (usage.limitReveals || 0) + '</div>' +
      '</div>' +
      '<div class="nh-actions">' +
        (email ? '<a href="/account" style="text-decoration:none"><button class="primary" id="nh-temp-account">Account</button></a>' : '') +
        (email ? '<button id="nh-temp-logout">Logout</button>' : '<a href="/signup" style="text-decoration:none"><button id="nh-temp-signup">Sign up</button></a>') +
      '</div>'
    );
  }

  function inject() {
    const container = document.createElement('div');
    container.id = 'nh-temp-header';
    // the styling comes from public/nh-temp-header.css
    const state = readState();
    container.innerHTML = buildHtml(state.email, state.usage);
    document.body.appendChild(container);

    // attach handlers
    const logout = document.getElementById('nh-temp-logout');
    if (logout) {
      logout.addEventListener('click', function () {
        try {
          localStorage.removeItem('nh_user_email');
          localStorage.removeItem('nh_usage');
          localStorage.removeItem('nh_usage_last_update');
        } catch (e) { /* ignore */ }
        window.location.reload();
      });
    }
  }

  inject();

  // Update function
  function refresh() {
    const el = document.getElementById('nh-temp-header');
    if (!el) { inject(); return; }
    const s = readState();
    if (!s.email) {
      // hide if not signed in
      el.classList.add('hidden');
    } else {
      el.classList.remove('hidden');
      el.innerHTML = buildHtml(s.email, s.usage);
      // reattach logout
      const logout = document.getElementById('nh-temp-logout');
      if (logout) {
        logout.addEventListener('click', function () {
          try {
            localStorage.removeItem('nh_user_email');
            localStorage.removeItem('nh_usage');
            localStorage.removeItem('nh_usage_last_update');
          } catch (e) {}
          window.location.reload();
        });
      }
    }
  }

  // Listen for localStorage changes from signup redirect or other tabs
  window.addEventListener('storage', function (e) {
    if (!e) return;
    if (e.key === 'nh_user_email' || e.key === 'nh_usage' || e.key === 'nh_usage_last_update') {
      setTimeout(refresh, 50);
    }
  });

  // Poll as a fallback for single-tab writes that do a redirect (e.g., signup flow)
  let lastEmail = localStorage.getItem('nh_user_email');
  setInterval(function () {
    const now = localStorage.getItem('nh_user_email');
    if (now !== lastEmail) {
      lastEmail = now;
      refresh();
    }
  }, 750);
})();

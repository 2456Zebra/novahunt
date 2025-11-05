(function () {
  const root = document.getElementById('root');
  if (!root) return;

  // Helpers
  function maskEmail(email) {
    try {
      const [local, domain] = (email || '').split('@');
      if (!local || !domain) return email || '';
      const keep = 2; // keep last 2 chars visible
      const maskedLocal = local.length <= keep ? '*'.repeat(local.length) : '*'.repeat(Math.max(0, local.length - keep)) + local.slice(-keep);
      return `${maskedLocal}@${domain}`;
    } catch (e) {
      return email || '';
    }
  }

  function showMessage(text, type = 'info') {
    const el = document.getElementById('nh-message');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = type === 'error' ? '#d9534f' : type === 'success' ? '#28a745' : '#007bff';
  }

  // safer DOM-building renderResults (avoid innerHTML for dynamic content)
  function renderResults(items, showAll = false, mode = 'emails') {
    const ul = document.getElementById('nh-results');
    if (!ul) return;
    ul.innerHTML = '';
    const list = showAll ? items : (items || []).slice(0, 3);
    list.forEach((it) => {
      const li = document.createElement('li');
      li.style.padding = '6px 8px';
      li.style.borderBottom = '1px solid #eee';

      const emailEl = document.createElement('div');
      emailEl.style.display = 'flex';
      emailEl.style.justifyContent = 'space-between';
      emailEl.style.alignItems = 'center';

      const left = document.createElement('div');

      const primary = document.createElement('div');
      primary.style.color = '#111';
      primary.style.fontWeight = '700';
      const secondary = document.createElement('div');
      secondary.style.fontSize = '0.9rem';
      secondary.style.color = '#666';

      if (mode === 'ai') {
        primary.textContent = it.name || it.title || '(Lead)';
        const secondaryParts = [];
        if (it.title) secondaryParts.push(it.title);
        if (it.email) secondaryParts.push(maskEmail(it.email));
        secondary.textContent = secondaryParts.join(' • ');
      } else {
        const displayEmail = mode === 'import' ? (it.email || '') : maskEmail(it.email || '');
        primary.textContent = displayEmail || '(no email)';
        secondary.textContent = `${it.name || '—'}${it.title ? ' • ' + it.title : ''}`.trim();
      }

      left.appendChild(primary);
      left.appendChild(secondary);

      const right = document.createElement('div');
      right.style.textAlign = 'right';
      const score = document.createElement('div');
      score.style.fontWeight = '600';
      score.style.color = '#007bff';
      score.textContent = `${Math.round((it.confidence || 0) * 100)}%`;
      right.appendChild(score);

      emailEl.appendChild(left);
      emailEl.appendChild(right);
      li.appendChild(emailEl);

      // Reveal button (Pro feature)
      const actions = document.createElement('div');
      actions.style.marginTop = '6px';
      const revealBtn = document.createElement('button');
      revealBtn.textContent = 'Reveal Full Email';
      revealBtn.style.padding = '6px 8px';
      revealBtn.style.borderRadius = '6px';
      revealBtn.style.border = '1px solid #ddd';
      revealBtn.style.background = '#fff';
      revealBtn.addEventListener('click', () => {
        alert('Reveal is a Pro feature. Sign up to view full emails.');
      });
      actions.appendChild(revealBtn);

      li.appendChild(actions);
      ul.appendChild(li);
    });

    const moreWrap = document.getElementById('nh-more-wrap');
    if (!moreWrap) return;
    moreWrap.innerHTML = '';
    if ((items || []).length > 3 && !showAll) {
      const showMoreBtn = document.createElement('button');
      showMoreBtn.id = 'nh-show-more';
      showMoreBtn.style.padding = '.5rem .75rem';
      showMoreBtn.style.borderRadius = '6px';
      showMoreBtn.style.background = '#007bff';
      showMoreBtn.style.color = '#fff';
      showMoreBtn.style.border = 'none';
      showMoreBtn.style.marginTop = '8px';
      showMoreBtn.textContent = `Show ${items.length - 3} more`;
      showMoreBtn.addEventListener('click', () => {
        renderResults(items, true, mode);
      });
      moreWrap.appendChild(showMoreBtn);
    }
  }

  // mode-aware sample leads generator
  function sampleLeadsFor(domain, mode) {
    const d = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'example.com';
    const base = d.includes('.') ? d : `${d}.com`;

    if (mode === 'ai') {
      return [
        { email: `sara.marketing@${base}`, name: 'Sara Marketing', title: 'Growth Marketer', confidence: 0.94 },
        { email: `tom.lead@${base}`, name: 'Tom Lead', title: 'Head of Demand Gen', confidence: 0.89 },
        { email: `ops@${base}`, name: '', title: 'Operations', confidence: 0.82 },
        { email: `partnerships@${base}`, name: '', title: 'Partnerships', confidence: 0.70 },
        { email: `bizdev@${base}`, name: '', title: 'Business Development', confidence: 0.65 }
      ];
    } else if (mode === 'import') {
      return [
        { email: `imported.user1@${base}`, name: 'Imported User 1', title: 'Marketing Manager', confidence: 0.78 },
        { email: `imported.user2@${base}`, name: 'Imported User 2', title: 'Sales Lead', confidence: 0.72 },
        { email: `imported.user3@${base}`, name: 'Imported User 3', title: 'Director', confidence: 0.68 }
      ];
    }

    return [
      { email: `john.doe@${base}`, name: 'John Doe', title: 'Head of Marketing', confidence: 0.92 },
      { email: `jane.smith@${base}`, name: 'Jane Smith', title: 'VP Sales', confidence: 0.87 },
      { email: `marketing@${base}`, name: '', title: '', confidence: 0.80 },
      { email: `press@${base}`, name: '', title: '', confidence: 0.66 },
      { email: `info@${base}`, name: '', title: '', confidence: 0.55 },
    ];
  }

  async function callApi(domain, mode) {
    try {
      if (mode === 'import') {
        return null;
      } else {
        const resp = await fetch(`/api/find-emails?domain=${encodeURIComponent(domain)}`);
        if (!resp.ok) return null;
        return resp.json();
      }
    } catch (e) {
      return null;
    }
  }

  // Build UI
  root.innerHTML = `
    <div style="font-family:Arial, Helvetica, sans-serif; padding:2rem; text-align:center;">
      <h1 style="color:#007bff; margin:0">NovaHunt</h1>
      <p style="color:#333; margin-top:.25rem">AI-Powered Lead Generation</p>

      <div style="margin-top:1rem; display:flex; justify-content:center; gap:8px; align-items:center;">
        <select id="nh-mode" aria-label="Choose hunt mode" style="padding:.5rem; border:1px solid #ddd; border-radius:6px;">
          <option value="emails" selected>Hunt Emails</option>
          <option value="import">Hunt Import Records</option>
          <option value="ai">Hunt AI Leads</option>
        </select>

        <input id="nh-domain" placeholder="Enter domain (e.g. stripe.com or coca-cola.com)"
          style="width:46%; padding:.5rem; border:1px solid #ddd; border-radius:6px" />

        <button id="nh-search" style="margin-left:.5rem; padding:.5rem 1rem; border-radius:6px; background:#007bff; color:#fff; border:none;">Hunt Emails</button>
      </div>

      <!-- help placed directly under the top controls so it changes with the pulldown -->
      <div id="nh-help-top" style="margin-top:.75rem; max-width:900px; margin-left:auto; margin-right:auto; color:#666; font-size:0.95rem; text-align:center;"> 
      </div>

      <div id="nh-demo" style="margin-top:1.5rem; text-align:left; display:inline-block; width:80%; max-width:900px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 id="nh-demo-title" style="margin:.25rem 0">Demo: Sample Leads</h3>
          <div id="nh-mode-msg" style="font-size:.9rem; color:#666">Free: 3 demo leads • Pro: unlock more</div>
        </div>

        <ul id="nh-results" style="background:#fafafa; border:1px solid #eee; padding:1rem; border-radius:6px; list-style:none; margin:0; margin-top:8px;"></ul>
        <div id="nh-more-wrap"></div>

        <div style="margin-top:.75rem; color:#555; font-size:.9rem;">
          Want the full list? <button id="nh-upgrade" style="margin-left:.5rem; padding:.4rem .7rem; border-radius:6px;">Upgrade to Pro</button>
        </div>
      </div>

      <div style="margin-top:1.25rem;">
        <button id="nh-signup" style="margin:5px; padding:10px;">Sign Up</button>
        <button id="nh-signin" style="margin:5px; padding:10px;">Sign In</button>
      </div>

      <div id="nh-message" style="margin-top:1rem; color:#007bff"></div>
    </div>
  `;

  // UI wiring
  const modeSelect = document.getElementById('nh-mode');
  const primaryBtn = document.getElementById('nh-search');
  const helpBox = document.getElementById('nh-help-top');
  const modeMsg = document.getElementById('nh-mode-msg');
  const demoTitle = document.getElementById('nh-demo-title');
  const btnUpgrade = document.getElementById('nh-upgrade');
  const btnSignin = document.getElementById('nh-signin');
  const btnSignup = document.getElementById('nh-signup');

  function setButtonLoading(btn, loadingText = 'Please wait...') {
    if (!btn) return () => {};
    const prevText = btn.textContent;
    btn.disabled = true;
    btn.textContent = loadingText;
    return () => {
      btn.disabled = false;
      btn.textContent = prevText;
    };
  }

  function updateUIForMode() {
    const mode = modeSelect.value;
    if (mode === 'emails') {
      primaryBtn.textContent = 'Hunt Emails';
      document.getElementById('nh-domain').placeholder = 'Enter domain (e.g. stripe.com)';
      helpBox.textContent = 'Enter a domain to hunt publicly available or AI-inferred corporate email patterns. The first 3 leads are free as a demo.';
      modeMsg.textContent = 'Free: 3 demo leads • Pro: unlock more';
      if (demoTitle) demoTitle.textContent = 'Demo: Sample Emails';
    } else if (mode === 'import') {
      primaryBtn.textContent = 'Upload CSV';
      document.getElementById('nh-domain').placeholder = 'Optional: use domain to filter import (or leave blank)';
      helpBox.innerHTML = 'Upload a CSV of domains or names to enrich. For demo, you can paste comma-separated emails in the prompt after clicking the button.';
      modeMsg.textContent = 'Import mode • Enrich bulk records';
      if (demoTitle) demoTitle.textContent = 'Demo: Import Records';
    } else if (mode === 'ai') {
      primaryBtn.textContent = 'Hunt AI Leads';
      document.getElementById('nh-domain').placeholder = 'Try natural language (e.g. "marketing managers in tech USA")';
      helpBox.textContent = 'AI mode: use natural language; the system will attempt to find relevant lead roles and inferred emails (demo results shown).';
      modeMsg.textContent = 'AI-powered search • Try natural queries';
      if (demoTitle) demoTitle.textContent = 'Demo: AI Leads';
    }

    const domainForDemo = (document.getElementById('nh-domain').value || '').trim() || 'coca-cola.com';
    const samples = sampleLeadsFor(domainForDemo, mode);
    renderResults(samples, false, mode);

    const typeLabel = mode === 'emails' ? 'sample emails' : mode === 'import' ? 'import records' : 'AI leads';
    showMessage(`Showing 3 demo ${typeLabel} for ${domainForDemo}.`, 'info');
  }

  modeSelect.addEventListener('change', updateUIForMode);
  updateUIForMode(); // initial

  document.getElementById('nh-search').addEventListener('click', async () => {
    const mode = modeSelect.value;
    const domain = (document.getElementById('nh-domain').value || '').trim() || 'example.com';

    if (mode === 'import') {
      const paste = prompt('Paste comma-separated emails for demo import (or click Cancel):');
      if (!paste) return;
      const emails = paste.split(',').map(s => s.trim()).filter(Boolean);
      showMessage(`Imported ${emails.length} records (demo).`, 'success');
      try {
        const resp = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails })
        });
        const json = await resp.json();
        if (json && Array.isArray(json.results)) {
          renderResults(json.results, false, 'import');
        } else {
          renderResults(sampleLeadsFor(domain, 'import'), false, 'import');
        }
      } catch (e) {
        renderResults(sampleLeadsFor(domain, 'import'), false, 'import');
      }
      return;
    }

    const samples = sampleLeadsFor(domain, mode);
    renderResults(samples, false, mode);
    showMessage(`Showing 3 demo leads for ${domain}.`, 'info');

    const api = await callApi(domain, mode);
    if (api && Array.isArray(api.emails) && api.emails.length) {
      renderResults(api.emails, false, mode);
      showMessage(`Found ${api.emails.length} leads for ${domain}.`, 'success');
    }
  });

  btnUpgrade.addEventListener('click', async () => {
    const email = prompt('Enter your email to start Checkout (use test email for sandbox):');
    if (!email) return;
    const done = setButtonLoading(btnUpgrade, 'Starting checkout...');
    showMessage('Starting checkout...', 'info');
    try {
      const resp = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, successUrl: window.location.origin + '/?success=1', cancelUrl: window.location.origin + '/?canceled=1' })
      });
      let json = null;
      try { json = await resp.json(); } catch (e) { json = null; }

      if (resp.ok && json && json.url) {
        window.location.href = json.url;
      } else {
        const errMsg = json && json.error ? json.error : (resp.statusText || `Error ${resp.status}`);
        console.error('Failed to create checkout session', json);
        showMessage(errMsg, 'error');
      }
    } catch (err) {
      console.error('Checkout request failed', err);
      showMessage('Unable to start checkout. Check console for details.', 'error');
    } finally {
      done();
    }
  });

  btnSignin.addEventListener('click', async () => {
    const email = prompt('Enter your email to sign in (we will send a magic link):');
    if (!email) return;
    const done = setButtonLoading(btnSignin, 'Sending sign-in link...');
    showMessage('Sending sign-in link...', 'info');
    try {
      const resp = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      let json = null;
      try { json = await resp.json(); } catch (e) { json = null; }

      if (resp.ok) {
        showMessage(`Magic link sent to ${email}.`, 'success');
        if (json && json.link) console.info('Dev magic link:', json.link);
      } else {
        const errMsg = json && json.error ? json.error : (resp.statusText || `Error ${resp.status}`);
        showMessage(errMsg, 'error');
      }
    } catch (err) {
      console.error('Sign-in request failed', err);
      showMessage('Network error. Check console.', 'error');
    } finally {
      done();
    }
  });

  btnSignup.addEventListener('click', async () => {
    const email = prompt('Enter your email to sign up:');
    if (!email) return;
    const done = setButtonLoading(btnSignup, 'Creating account...');
    showMessage('Creating account...', 'info');
    try {
      const resp = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      let json = null;
      try { json = await resp.json(); } catch (e) { json = null; }

      if (resp.ok) {
        showMessage(`Account created for ${email}. A verification link was sent.`, 'success');
        if (json && json.demoLeads) console.info('Demo leads granted:', json.demoLeads);
      } else {
        const errMsg = json && json.error ? json.error : (resp.statusText || `Error ${resp.status}`);
        showMessage(errMsg, 'error');
      }
    } catch (err) {
      console.error('Sign-up request failed', err);
      showMessage('Network error. Check console.', 'error');
    } finally {
      done();
    }
  });

  // NOTE: no unconditional initial render here; updateUIForMode drives initial display
})();

(function () {
  const root = document.getElementById('root');
  if (!root) return;

  // Helpers
  function maskEmail(email) {
    try {
      const [local, domain] = email.split('@');
      if (!local || !domain) return email;
      const keep = 2; // keep last 2 chars visible
      const maskedLocal = local.length <= keep ? '*'.repeat(local.length) : '*'.repeat(Math.max(0, local.length - keep)) + local.slice(-keep);
      return `${maskedLocal}@${domain}`;
    } catch (e) {
      return email;
    }
  }

  function renderResults(items, showAll = false) {
    const ul = document.getElementById('nh-results');
    ul.innerHTML = '';
    const list = showAll ? items : items.slice(0, 3);
    list.forEach((it) => {
      const li = document.createElement('li');
      li.style.padding = '6px 8px';
      li.style.borderBottom = '1px solid #eee';

      const emailEl = document.createElement('div');
      emailEl.style.display = 'flex';
      emailEl.style.justifyContent = 'space-between';
      emailEl.style.alignItems = 'center';

      const left = document.createElement('div');
      left.innerHTML = `<strong style="color:#111;">${maskEmail(it.email)}</strong><div style="font-size:0.9rem;color:#666">${it.name || '—'} ${it.title ? '• ' + it.title : ''}</div>`;

      const right = document.createElement('div');
      right.style.textAlign = 'right';
      right.innerHTML = `<div style="font-weight:600;color:#007bff">${Math.round((it.confidence || 0) * 100)}%</div>`;

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
    if (items.length > 3 && !showAll) {
      moreWrap.innerHTML = `<button id="nh-show-more" style="padding:.5rem .75rem;border-radius:6px;background:#007bff;color:#fff;border:none;margin-top:8px;">Show ${items.length - 3} more</button>`;
      document.getElementById('nh-show-more').addEventListener('click', () => {
        renderResults(items, true);
      });
    } else {
      moreWrap.innerHTML = '';
    }
  }

  // Mode-aware sample leads generator
  function sampleLeadsFor(domain, mode) {
    const d = domain.replace(/^https?:\/\/|^www\./g, '').split('/')[0] || 'example.com';
    const base = d.includes('.') ? d : `${d}.com`;

    if (mode === 'ai') {
      // AI leads: more role-like, slightly higher confidence for demo
      return [
        { email: `sara.marketing@${base}`, name: 'Sara Marketing', title: 'Growth Marketer', confidence: 0.94 },
        { email: `tom.lead@${base}`, name: 'Tom Lead', title: 'Head of Demand Gen', confidence: 0.89 },
        { email: `ops@${base}`, name: '', title: '', confidence: 0.82 },
        { email: `partnerships@${base}`, name: '', title: '', confidence: 0.7 },
        { email: `bizdev@${base}`, name: '', title: '', confidence: 0.65 }
      ];
    } else if (mode === 'import') {
      // Import mode shows example enrichment results
      return [
        { email: `imported.user1@${base}`, name: 'Imported User 1', title: 'Marketing Manager', confidence: 0.78 },
        { email: `imported.user2@${base}`, name: 'Imported User 2', title: 'Sales Lead', confidence: 0.72 },
        { email: `imported.user3@${base}`, name: 'Imported User 3', title: 'Director', confidence: 0.68 }
      ];
    }

    // default: plain email hunt
    return [
      { email: `john.doe@${base}`, name: 'John Doe', title: 'Head of Marketing', confidence: 0.92 },
      { email: `jane.smith@${base}`, name: 'Jane Smith', title: 'VP Sales', confidence: 0.87 },
      { email: `marketing@${base}`, name: '', title: '', confidence: 0.8 },
      { email: `press@${base}`, name: '', title: '', confidence: 0.66 },
      { email: `info@${base}`, name: '', title: '', confidence: 0.55 },
    ];
  }

  async function callApi(domain, mode) {
    try {
      // For import mode we call /api/import with dummy data; emails mode calls find-emails
      if (mode === 'import') {
        // no-op for demo; server-side import expects POST JSON; return null to use samples
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
          <h3 style="margin:.25rem 0">Demo: Sample Leads</h3>
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

  function updateUIForMode() {
    const mode = modeSelect.value;
    if (mode === 'emails') {
      primaryBtn.textContent = 'Hunt Emails';
      document.getElementById('nh-domain').placeholder = 'Enter domain (e.g. stripe.com)';
      helpBox.textContent = 'Enter a domain to hunt publicly available or AI-inferred corporate email patterns. The first 3 leads are free as a demo.';
      modeMsg.textContent = 'Free: 3 demo leads • Pro: unlock more';
    } else if (mode === 'import') {
      primaryBtn.textContent = 'Upload CSV';
      document.getElementById('nh-domain').placeholder = 'Optional: use domain to filter import (or leave blank)';
      helpBox.innerHTML = 'Upload a CSV of domains or names to enrich. For demo, you can paste comma-separated emails in the prompt after clicking the button.';
      modeMsg.textContent = 'Import mode • Enrich bulk records';
    } else if (mode === 'ai') {
      primaryBtn.textContent = 'Hunt AI Leads';
      document.getElementById('nh-domain').placeholder = 'Try natural language (e.g. "marketing managers in tech USA")';
      helpBox.textContent = 'AI mode: use natural language; the system will attempt to find relevant lead roles and inferred emails (demo results shown).';
      modeMsg.textContent = 'AI-powered search • Try natural queries';
    }
  }

  modeSelect.addEventListener('change', updateUIForMode);
  updateUIForMode(); // initial

  document.getElementById('nh-search').addEventListener('click', async () => {
    const mode = modeSelect.value;
    const domain = (document.getElementById('nh-domain').value || '').trim() || 'example.com';

    if (mode === 'import') {
      // For demo: prompt for simple comma separated emails and call import endpoint
      const paste = prompt('Paste comma-separated emails for demo import (or click Cancel):');
      if (!paste) return;
      const emails = paste.split(',').map(s => s.trim()).filter(Boolean);
      document.getElementById('nh-message').textContent = `Imported ${emails.length} records (demo).`;
      try {
        const resp = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails })
        });
        const json = await resp.json();
        if (json && Array.isArray(json.results)) {
          renderResults(json.results, false);
        } else {
          renderResults(sampleLeadsFor(domain, 'import'), false);
        }
      } catch (e) {
        renderResults(sampleLeadsFor(domain, 'import'), false);
      }
      return;
    }

    // For emails and AI modes: show immediate samples and then try API
    const samples = sampleLeadsFor(domain, mode);
    renderResults(samples, false);
    document.getElementById('nh-message').textContent = `Showing 3 demo leads for ${domain}.`;

    const api = await callApi(domain, mode);
    if (api && Array.isArray(api.emails) && api.emails.length) {
      renderResults(api.emails, false);
      document.getElementById('nh-message').textContent = `Found ${api.emails.length} leads for ${domain}.`;
    }
  });

  document.getElementById('nh-upgrade').addEventListener('click', async () => {
    // Prompt for email then call server to create a Checkout session and redirect to Stripe Checkout
    const email = prompt('Enter your email to start Checkout (use test email for sandbox):');
    if (!email) return;
    document.getElementById('nh-message').textContent = 'Starting checkout...';
    try {
      const resp = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, successUrl: window.location.origin + '/?success=1', cancelUrl: window.location.origin + '/?canceled=1' })
      });
      const json = await resp.json();
      if (json && json.url) {
        window.location.href = json.url;
      } else {
        console.error('Failed to create checkout session', json);
        alert('Unable to start checkout. Check console for details.');
        document.getElementById('nh-message').textContent = '';
      }
    } catch (err) {
      console.error('Checkout request failed', err);
      alert('Unable to start checkout. Check console for details.');
      document.getElementById('nh-message').textContent = '';
    }
  });

  document.getElementById('nh-signin').addEventListener('click', () => { alert('Sign In (demo): magic link would be sent.'); });
  document.getElementById('nh-signup').addEventListener('click', () => { alert('Sign Up (demo): 50 free leads added to your account (on real signup).'); });

  // initial sample
  renderResults(sampleLeadsFor('coca-cola.com', 'emails'));
  document.getElementById('nh-message').textContent = 'Demo loaded (3 sample leads).';
})();

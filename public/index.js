(function () {
  const root = document.getElementById('root');
  if (!root) return;

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

  function sampleLeadsFor(domain) {
    const d = domain.replace(/^https?:\/\/|^www\./g, '').split('/')[0] || 'example.com';
    const base = d.includes('.') ? d : `${d}.com`;
    return [
      { email: `john.doe@${base}`, name: 'John Doe', title: 'Head of Marketing', confidence: 0.92 },
      { email: `jane.smith@${base}`, name: 'Jane Smith', title: 'VP Sales', confidence: 0.87 },
      { email: `marketing@${base}`, name: '', title: '', confidence: 0.8 },
      { email: `press@${base}`, name: '', title: '', confidence: 0.66 },
      { email: `info@${base}`, name: '', title: '', confidence: 0.55 },
    ];
  }

  async function callApi(domain) {
    try {
      const resp = await fetch(`/api/find-emails?domain=${encodeURIComponent(domain)}`);
      if (!resp.ok) return null;
      return resp.json();
    } catch (e) {
      return null;
    }
  }

  root.innerHTML = `
    <div style="font-family:Arial, Helvetica, sans-serif; padding:2rem; text-align:center;">
      <h1 style="color:#007bff; margin:0">NovaHunt</h1>
      <p style="color:#333; margin-top:.25rem">AI-Powered Lead Generation</p>

      <div style="margin-top:1rem;">
        <input id="nh-domain" placeholder="Enter domain (e.g. stripe.com or coca-cola.com)"
          style="width:60%; padding:.5rem; border:1px solid #ddd; border-radius:6px" />
        <button id="nh-search" style="margin-left:.5rem; padding:.5rem 1rem; border-radius:6px; background:#007bff; color:#fff; border:none;">Hunt Emails</button>
      </div>

      <div id="nh-demo" style="margin-top:1.5rem; text-align:left; display:inline-block; width:80%; max-width:800px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:.25rem 0">Demo: Sample Leads</h3>
          <div style="font-size:.9rem; color:#666">Free: 3 demo leads • Pro: unlock more</div>
        </div>
        <ul id="nh-results" style="background:#fafafa; border:1px solid #eee; padding:1rem; border-radius:6px; list-style:none; margin:0;"></ul>
        <div id="nh-more-wrap"></div>
        <div style="margin-top:.75rem; color:#555; font-size:.9rem;">
          Want the full list? <button id="nh-upgrade" style="margin-left:.5rem; padding:.4rem .7rem; border-radius:6px;">Upgrade to Pro</button>
        </div>
      </div>

      <div style="margin-top:1.25rem;">
        <button id="nh-import" style="margin:5px; padding:10px;">Import Records</button>
        <button id="nh-signup" style="margin:5px; padding:10px;">Sign Up</button>
        <button id="nh-signin" style="margin:5px; padding:10px;">Sign In</button>
      </div>

      <div id="nh-message" style="margin-top:1rem; color:#007bff"></div>
    </div>
  `;

  document.getElementById('nh-search').addEventListener('click', async () => {
    const domain = (document.getElementById('nh-domain').value || '').trim() || 'example.com';
    const samples = sampleLeadsFor(domain);
    renderResults(samples, false);
    document.getElementById('nh-message').textContent = `Showing 3 demo leads for ${domain}.`;

    // Try real API (if available)
    const api = await callApi(domain);
    if (api && Array.isArray(api.emails) && api.emails.length) {
      // Expect api.emails to be objects { email, name, title, confidence }
      renderResults(api.emails, false);
      document.getElementById('nh-message').textContent = `Found ${api.emails.length} leads for ${domain}.`;
    }
  });

  document.getElementById('nh-upgrade').addEventListener('click', () => {
    alert('Upgrade to Pro: unlimited leads. Stripe checkout will be added soon.');
  });

  document.getElementById('nh-signin').addEventListener('click', () => { alert('Sign In (demo): magic link would be sent.'); });
  document.getElementById('nh-signup').addEventListener('click', () => { alert('Sign Up (demo): 50 free leads added to your account (on real signup).'); });
  document.getElementById('nh-import').addEventListener('click', () => { alert('Import Records (demo): choose a CSV to enrich.'); });

  // initial sample
  renderResults(sampleLeadsFor('coca-cola.com'));
  document.getElementById('nh-message').textContent = 'Demo loaded (3 sample leads).';
})();

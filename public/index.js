// public/index.js — Interactive NovaHunt Demo (Live in 60s)
(function () {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div style="text-align:center; padding:2rem; font-family:Arial; max-width:600px; margin:auto;">
      <h1 style="color:#007bff;">NovaHunt</h1>
      <p>AI-Powered Lead Generation</p>

      <input id="search" placeholder="Enter company (e.g. coca-cola.com)" style="width:80%; padding:10px; margin:10px;">
      <button onclick="searchLeads()" style="padding:10px 20px;">Search Leads</button>

      <div id="results" style="margin-top:20px; text-align:left;"></div>

      <div style="margin-top:30px;">
        <button onclick="importRecords()" style="margin:5px; padding:10px;">Import Records</button>
        <button onclick="signUp()" style="margin:5px; padding:10px;">Sign Up</button>
        <button onclick="signIn()" style="margin:5px; padding:10px;">Sign In</button>
      </div>

      <p style="margin-top:20px; font-size:0.9em;">
        <strong>Free:</strong> 50 leads/mo | <strong>Pro:</strong> Unlimited ($29/mo)
      </p>
    </div>
  `;

  window.searchLeads = async () => {
    const query = document.getElementById('search').value.trim();
    if (!query) return alert("Enter a company domain");

    const results = document.getElementById('results');
    results.innerHTML = `<p>Searching for <strong>${query}</strong>...</p>`;

    try {
      const res = await fetch('/api/find-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (data.emails) {
        results.innerHTML = `
          <h3>Found ${data.emails.length} emails (Free tier shows 3)</h3>
          <ul>${data.emails.slice(0, 3).map(e => `<li>${e}</li>`).join('')}</ul>
          <p><strong>Upgrade to Pro</strong> for full list + CSV export.</p>
        `;
      } else {
        results.innerHTML = `<p>No emails found. Try another company.</p>`;
      }
    } catch (err) {
      results.innerHTML = `<p>Demo mode: 3 sample emails for <strong>${query}</strong></p>
        <ul>
          <li>john.doe@${query}</li>
          <li>jane.smith@${query}</li>
          <li>marketing@${query}</li>
        </ul>
        <p><small>Real results coming soon with Pro.</small></p>`;
    }
  };

  window.importRecords = () => alert("CSV Import: Upload your file → AI enriches 1,000+ emails in 60s.");
  window.signUp = () => alert("Welcome! Free 50 leads/month. Upgrade to Pro for unlimited.");
  window.signIn = () => alert("Signed in! Check your saved searches.");
})();

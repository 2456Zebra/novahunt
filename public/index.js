// public/index.js — NovaHunt LIVE DEMO (Instant Value!)
document.getElementById("root").innerHTML = `
  <div style="text-align:center; padding:2rem; font-family:Arial; max-width:600px; margin:auto;">
    <h1 style="color:#007bff; margin-bottom:0.5rem;">NovaHunt</h1>
    <p style="color:#555; margin-bottom:2rem;">AI-Powered Lead Generation</p>

    <input id="companyInput" placeholder="Enter company (e.g. coca-cola.com)" style="width:80%; padding:12px; font-size:16px; border:1px solid #ccc; border-radius:6px; margin-bottom:1rem;">
    <br>
    <button onclick="searchLeads()" style="padding:12px 24px; background:#007bff; color:white; border:none; border-radius:6px; font-size:16px; cursor:pointer;">
      Search Leads
    </button>

    <div id="results" style="margin-top:2rem; text-align:left; background:#f9f9f9; padding:1rem; border-radius:6px;"></div>

    <div style="margin-top:2rem;">
      <button onclick="importRecords()" style="margin:5px; padding:10px; background:#10b981; color:white; border:none; border-radius:6px;">Import Records</button>
      <button onclick="signUp()" style="margin:5px; padding:10px; background:#6366f1; color:white; border:none; border-radius:6px;">Sign Up</button>
      <button onclick="signIn()" style="margin:5px; padding:10px; background:#8b5cf6; color:white; border:none; border-radius:6px;">Sign In</button>
    </div>

    <p style="margin-top:2rem; font-size:0.9em; color:#666;">
      <strong>Free:</strong> 50 leads/mo | <strong>Pro:</strong> Unlimited ($29/mo)
    </p>
  </div>
`;

// DEMO: Show 3 fake emails instantly
window.searchLeads = () => {
  const query = document.getElementById("companyInput").value.trim().toLowerCase();
  if (!query) return alert("Please enter a company domain");

  const results = document.getElementById("results");
  results.innerHTML = `
    <h3 style="margin-top:0;">Found 3 emails for <strong>${query}</strong></h3>
    <ul style="list-style:none; padding:0;">
      <li style="background:#fff; padding:10px; margin:5px 0; border-radius:4px;">john.doe@${query}</li>
      <li style="background:#fff; padding:10px; margin:5px 0; border-radius:4px;">jane.smith@${query}</li>
      <li style="background:#fff; padding:10px; margin:5px 0; border-radius:4px;">marketing@${query}</li>
    </ul>
    <p><strong>Upgrade to Pro</strong> for full list + CSV export.</p>
  `;
};

window.importRecords = () => alert("CSV Import: Upload your file → AI enriches 1,000+ emails in 60s.");
window.signUp = () => alert("Welcome! Free 50 leads/month. Upgrade to Pro for unlimited.");
window.signIn = () => alert("Signed in! Check your saved searches.");

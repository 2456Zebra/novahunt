(function () {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="font-family: Arial, Helvetica, sans-serif; padding: 2rem; max-width: 900px; margin: 0 auto; color: #111;">
      <h1 style="margin-top:0">NovaHunt</h1>
      <p style="color:#444; font-size:1.1rem;">
        Temporary fallback UI — the full app will return shortly. If you see this page,
        the site is serving static assets correctly.
      </p>
      <p style="color:#666; font-size:0.95rem;">
        Note: this is a temporary non-react script. Replace with the built React bundle
        (public/index.js) once available.
      </p>
      <hr />
      <p style="color:#007bff; font-weight:600;">Status: Temporary client script active</p>
    </div>
  `;
  console.log('NovaHunt temporary client script executed');
})();
(function () {
  const root = document.getElementById('root');
  if (!root) return;
  
  // Safe DOM construction instead of innerHTML to prevent XSS
  const container = document.createElement('div');
  container.style.cssText = 'font-family: Arial, Helvetica, sans-serif; padding: 2rem; max-width: 900px; margin: 0 auto; color: #111;';
  
  const h1 = document.createElement('h1');
  h1.style.marginTop = '0';
  h1.textContent = 'NovaHunt';
  
  const p1 = document.createElement('p');
  p1.style.cssText = 'color:#444; font-size:1.1rem;';
  p1.textContent = 'Temporary fallback UI — the full app will return shortly. If you see this page, the site is serving static assets correctly.';
  
  const p2 = document.createElement('p');
  p2.style.cssText = 'color:#666; font-size:0.95rem;';
  p2.textContent = 'Note: this is a temporary non-react script. Replace with the built React bundle (public/index.js) once available.';
  
  const hr = document.createElement('hr');
  
  const p3 = document.createElement('p');
  p3.style.cssText = 'color:#007bff; font-weight:600;';
  p3.textContent = 'Status: Temporary client script active';
  
  container.appendChild(h1);
  container.appendChild(p1);
  container.appendChild(p2);
  container.appendChild(hr);
  container.appendChild(p3);
  
  root.appendChild(container);
  
  console.log('NovaHunt temporary client script executed');
})();

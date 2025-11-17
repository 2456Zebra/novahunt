(function () {
  const root = document.getElementById('root');
  if (!root) return;

  // ... (keep the existing helpers/many functions above untouched) ...
  // We'll only replace the signup/signin button handlers to prompt for password and store session

  // find existing button wiring near the bottom of the file
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

  function showMessage(text, type = 'info') {
    const el = document.getElementById('nh-message');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = type === 'error' ? '#d9534f' : type === 'success' ? '#28a745' : '#007bff';
  }

  if (btnSignin) {
    btnSignin.addEventListener('click', async () => {
      const email = prompt('Enter your email to sign in:');
      if (!email) return;
      const password = prompt('Enter your password:');
      if (!password) return;
      const done = setButtonLoading(btnSignin, 'Signing in...');
      showMessage('Signing in...', 'info');
      try {
        const resp = await fetch('/api/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        let json = null;
        try { json = await resp.json(); } catch (e) { json = null; }

        if (resp.ok && json && json.session) {
          localStorage.setItem('nh_session', json.session);
          localStorage.setItem('nh_userEmail', email);
          showMessage(`Signed in as ${email}.`, 'success');
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
  }

  if (btnSignup) {
    btnSignup.addEventListener('click', async () => {
      const email = prompt('Enter your email to sign up:');
      if (!email) return;
      const password = prompt('Choose a password (min 8 chars):');
      if (!password) return;
      const done = setButtonLoading(btnSignup, 'Creating account...');
      showMessage('Creating account...', 'info');
      try {
        const resp = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        let json = null;
        try { json = await resp.json(); } catch (e) { json = null; }

        if (resp.status === 201 && json && json.session) {
          localStorage.setItem('nh_session', json.session);
          localStorage.setItem('nh_userEmail', email);
          showMessage(`Account created for ${email}. Signed in.`, 'success');
        } else if (resp.status === 409) {
          showMessage('Account already exists. Please sign in.', 'error');
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
  }

})();
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('loginBtn');
  var err = document.getElementById('error-msg');
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  err.style.display = 'none';
  try {
    var res = await fetch(window.location.origin + '/api/admin/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      })
    });
    var data = await res.json();
    if (data.success) {
      localStorage.setItem('mesob_admin_token', data.token);
      localStorage.setItem('mesob_admin', JSON.stringify(data.data));
      window.location.href = 'dashboard.html';
    } else {
      err.textContent = data.message || 'Invalid credentials';
      err.style.display = 'block';
    }
  } catch(ex) {
    err.textContent = 'Cannot connect to server. Make sure the backend is running.';
    err.style.display = 'block';
  }
  btn.textContent = 'Sign In';
  btn.disabled = false;
});

// ── Forgot Password ──
function showForgotForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = 'block';
}

function showLoginForm() {
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

document.getElementById('forgotForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn     = document.getElementById('forgotBtn');
  var errEl   = document.getElementById('forgot-error');
  var succEl  = document.getElementById('forgot-success');
  var email   = document.getElementById('resetEmail').value.trim();

  btn.textContent = 'Sending...';
  btn.disabled    = true;
  errEl.style.display  = 'none';
  succEl.style.display = 'none';

  try {
    var res  = await fetch(window.location.origin + '/api/admin/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    var data = await res.json();
    if (data.success) {
      succEl.textContent = '✅ ' + data.message;
      succEl.style.display = 'block';
      document.getElementById('resetEmail').value = '';
    } else {
      errEl.textContent = data.message || 'Failed to send reset link.';
      errEl.style.display = 'block';
    }
  } catch (err) {
    errEl.textContent = 'Network error: ' + err.message;
    errEl.style.display = 'block';
  } finally {
    btn.textContent = 'Send Reset Link';
    btn.disabled    = false;
  }
});

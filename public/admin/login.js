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

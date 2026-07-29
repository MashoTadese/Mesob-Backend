var API = window.location.origin + '/api';
var token = localStorage.getItem('mesob_admin_token');
if (!token) window.location.href = 'login.html';

function logout() {
  localStorage.removeItem('mesob_admin_token');
  localStorage.removeItem('mesob_admin');
  window.location.href = 'login.html';
}

function showAlert(id, msg, type) {
  var el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'alert ' + type;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 4000);
}

function setAvatar(admin) {
  var display = document.getElementById('avatarDisplay');
  if (!display) return;
  if (admin.avatar) {
    display.innerHTML = '<img src="' + admin.avatar + '" alt="Avatar">';
  } else {
    var initEl = document.getElementById('avatarInitials');
    if (initEl) initEl.textContent = (admin.name || 'A')[0].toUpperCase();
  }
}

async function loadProfile() {
  try {
    var res  = await fetch(API + '/admin/me', { headers: { Authorization: 'Bearer ' + token } });
    var data = await res.json();
    if (!data.success) { logout(); return; }
    var a = data.data;
    document.getElementById('profileName').textContent  = a.name;
    document.getElementById('profileEmail').textContent = a.email;
    document.getElementById('profileRole').textContent  = a.role.toUpperCase();
    document.getElementById('pName').value     = a.name     || '';
    document.getElementById('pEmail').value    = a.email    || '';
    document.getElementById('pPhone').value    = a.phone    || '';
    document.getElementById('pPosition').value = a.position || '';
    setAvatar(a);
  } catch(e) {
    showAlert('profileAlert', 'Failed to load profile. Please refresh.', 'error');
  }
}

// Avatar upload
document.getElementById('avatarInput').addEventListener('change', async function() {
  var file = this.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showAlert('avatarAlert', 'Image must be under 2MB', 'error'); return; }
  var formData = new FormData();
  formData.append('avatar', file);
  try {
    var res  = await fetch(API + '/admin/avatar', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: formData
    });
    var data = await res.json();
    if (data.success) {
      showAlert('avatarAlert', 'Profile picture updated!', 'success');
      setAvatar(data.data);
      var stored = JSON.parse(localStorage.getItem('mesob_admin') || '{}');
      stored.avatar = data.data.avatar;
      localStorage.setItem('mesob_admin', JSON.stringify(stored));
    } else {
      showAlert('avatarAlert', data.message || 'Upload failed', 'error');
    }
  } catch(e) {
    showAlert('avatarAlert', 'Upload failed. Try again.', 'error');
  }
});

// Update profile
document.getElementById('profileForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  try {
    var res  = await fetch(API + '/admin/profile', {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:     document.getElementById('pName').value,
        phone:    document.getElementById('pPhone').value,
        position: document.getElementById('pPosition').value,
      })
    });
    var data = await res.json();
    if (data.success) {
      showAlert('profileAlert', 'Profile updated successfully!', 'success');
      document.getElementById('profileName').textContent = data.data.name;
      var stored = JSON.parse(localStorage.getItem('mesob_admin') || '{}');
      stored.name = data.data.name;
      localStorage.setItem('mesob_admin', JSON.stringify(stored));
    } else {
      showAlert('profileAlert', data.message || 'Update failed', 'error');
    }
  } catch(e) {
    showAlert('profileAlert', 'Error updating profile', 'error');
  }
});

// Change password
document.getElementById('passForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn         = this.querySelector('button[type="submit"]');
  var newPass     = document.getElementById('newPass').value;
  var confirmPass = document.getElementById('confirmPass').value;
  if (newPass !== confirmPass) {
    showAlert('passAlert', 'New passwords do not match', 'error'); return;
  }
  if (newPass.length < 8) {
    showAlert('passAlert', 'Password must be at least 8 characters', 'error'); return;
  }
  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }
  try {
    var res  = await fetch(API + '/admin/change-password', {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: document.getElementById('currentPass').value,
        newPassword: newPass,
      })
    });
    var data = await res.json();
    if (data.success) {
      showAlert('passAlert', 'Password changed successfully!', 'success');
      document.getElementById('passForm').reset();
    } else {
      showAlert('passAlert', data.message || 'Failed to change password', 'error');
    }
  } catch(e) {
    showAlert('passAlert', 'Error changing password. Check your connection.', 'error');
  } finally {
    if (btn) { btn.textContent = 'Change Password'; btn.disabled = false; }
  }
});

loadProfile();


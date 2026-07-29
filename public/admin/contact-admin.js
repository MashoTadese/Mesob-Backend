var API   = window.location.origin + '/api';
var token = localStorage.getItem('mesob_admin_token');
if (!token) window.location.href = 'login.html';

function logout() {
  localStorage.removeItem('mesob_admin_token');
  localStorage.removeItem('mesob_admin');
  window.location.href = 'login.html';
}

function showAlert(id, msg, type) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert ' + type;
  el.style.display = 'block';
  setTimeout(function () { el.style.display = 'none'; }, 4000);
}

async function loadContent() {
  try {
    var res  = await fetch(API + '/content');
    var data = await res.json();
    if (!data.success) return;
    var c = data.data;
    document.getElementById('contact_phone').value   = c.contact_phone   || '';
    document.getElementById('contact_phone2').value  = c.contact_phone2  || '';
    document.getElementById('contact_email').value   = c.contact_email   || '';
    document.getElementById('contact_address').value = c.contact_address || '';
    document.getElementById('working_hours').value   = c.working_hours   || '';
    document.getElementById('working_sat').value     = c.working_sat     || '';
    document.getElementById('maps_url').value        = c.maps_url        || '';
    updatePreview();
  } catch (err) {
    showAlert('contactAlert', 'Failed to load: ' + err.message, 'error');
  }
}

function updatePreview() {
  var map = {
    'contact_phone':   'prev_phone',
    'contact_phone2':  'prev_phone2',
    'contact_email':   'prev_email',
    'contact_address': 'prev_address',
    'working_hours':   'prev_hours',
    'working_sat':     'prev_sat'
  };
  Object.keys(map).forEach(function(fid) {
    var inp = document.getElementById(fid);
    var out = document.getElementById(map[fid]);
    if (inp && out) out.textContent = inp.value || '-';
  });
}

// Live preview on every input
['contact_phone','contact_phone2','contact_email','contact_address','working_hours','working_sat'].forEach(function(id) {
  var inp = document.getElementById(id);
  if (inp) inp.addEventListener('input', updatePreview);
});

document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var payload = {
    contact_phone:   document.getElementById('contact_phone').value.trim(),
    contact_phone2:  document.getElementById('contact_phone2').value.trim(),
    contact_email:   document.getElementById('contact_email').value.trim(),
    contact_address: document.getElementById('contact_address').value.trim(),
    working_hours:   document.getElementById('working_hours').value.trim(),
    working_sat:     document.getElementById('working_sat').value.trim(),
    maps_url:        document.getElementById('maps_url').value.trim(),
  };
  try {
    var res  = await fetch(API + '/content', {
      method:  'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    var data = await res.json();
    if (data.success) {
      showAlert('contactAlert', 'Contact information saved successfully!', 'success');
    } else {
      showAlert('contactAlert', data.message || 'Failed to save', 'error');
    }
  } catch (err) {
    showAlert('contactAlert', 'Error: ' + err.message, 'error');
  }
});

loadContent();

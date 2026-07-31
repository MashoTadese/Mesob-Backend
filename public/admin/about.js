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
  setTimeout(function () { el.style.display = 'none'; }, 4000);
}

async function loadContent() {
  try {
    var res  = await fetch(API + '/content');
    var data = await res.json();
    if (!data.success) return;
    var c = data.data;
    document.getElementById('para1').value = c.about_para1 || '';
    document.getElementById('para2').value = c.about_para2 || '';
    document.getElementById('para3').value = c.about_para3 || '';
    var h = c.highlights || [];
    document.getElementById('h1').value = h[0] || '';
    document.getElementById('h2').value = h[1] || '';
    document.getElementById('h3').value = h[2] || '';
    document.getElementById('h4').value = h[3] || '';
  } catch (err) {
    showAlert('alert', 'Failed to load content: ' + err.message, 'error');
  }
}

// Save about paragraphs
document.getElementById('aboutForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var payload = {
    about_para1: document.getElementById('para1').value.trim(),
    about_para2: document.getElementById('para2').value.trim(),
    about_para3: document.getElementById('para3').value.trim(),
  };
  try {
    var res  = await fetch(API + '/content', {
      method:  'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    var data = await res.json();
    if (data.success) showAlert('alert', 'About text saved successfully!', 'success');
    else showAlert('alert', data.message || 'Failed to save', 'error');
  } catch (err) {
    showAlert('alert', 'Error: ' + err.message, 'error');
  }
});

// Save highlights
document.getElementById('highlightForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var highlights = [
    document.getElementById('h1').value.trim(),
    document.getElementById('h2').value.trim(),
    document.getElementById('h3').value.trim(),
    document.getElementById('h4').value.trim(),
  ].filter(Boolean);
  try {
    var res  = await fetch(API + '/content', {
      method:  'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ highlights }),
    });
    var data = await res.json();
    if (data.success) showAlert('alert2', 'Highlights saved successfully!', 'success');
    else showAlert('alert2', data.message || 'Failed to save', 'error');
  } catch (err) {
    showAlert('alert2', 'Error: ' + err.message, 'error');
  }
});

loadContent();


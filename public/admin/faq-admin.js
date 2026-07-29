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

async function loadFAQs() {
  try {
    var res  = await fetch(API + '/content');
    var data = await res.json();
    var faqs = (data.success && data.data.faqs) ? data.data.faqs : [];
    renderFAQs(faqs);
  } catch (err) {
    showAlert('listAlert', 'Failed to load FAQs: ' + err.message, 'error');
  }
}

function renderFAQs(list) {
  var el = document.getElementById('faqList');
  if (!list || !list.length) {
    el.innerHTML = '<p class="empty">No FAQs yet. Add your first one above.</p>';
    return;
  }
  el.innerHTML = list.map(function (f) {
    if (f.id === undefined || f.id === null) return '';
    // Escape to prevent XSS from admin-entered content
    var q = String(f.question || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    var a = String(f.answer   || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return '<div class="faq-item">' +
      '<div class="faq-content">' +
        '<div class="faq-q">Q: ' + q + '</div>' +
        '<div class="faq-a">A: ' + a + '</div>' +
      '</div>' +
      '<button class="del-btn" onclick="deleteFAQ(' + f.id + ')">✕ Delete</button>' +
    '</div>';
  }).join('');
}

document.getElementById('faqForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  var question = document.getElementById('faqQuestion').value.trim();
  var answer   = document.getElementById('faqAnswer').value.trim();
  if (!question || !answer) {
    showAlert('addAlert', 'Both question and answer are required.', 'error');
    return;
  }
  try {
    var res  = await fetch(API + '/content/faq', {
      method:  'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ question, answer }),
    });
    var data = await res.json();
    if (data.success) {
      showAlert('addAlert', '✅ FAQ added successfully!', 'success');
      document.getElementById('faqForm').reset();
      loadFAQs();
    } else {
      showAlert('addAlert', data.message || 'Failed to add FAQ.', 'error');
    }
  } catch (err) {
    showAlert('addAlert', 'Error: ' + err.message, 'error');
  }
});

async function deleteFAQ(id) {
  if (!confirm('Delete this FAQ?')) return;
  try {
    var res  = await fetch(API + '/content/faq/' + id, {
      method:  'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    });
    var data = await res.json();
    if (data.success) {
      showAlert('listAlert', '✅ FAQ deleted.', 'success');
      loadFAQs();
    } else {
      showAlert('listAlert', data.message || 'Failed to delete.', 'error');
    }
  } catch (err) {
    showAlert('listAlert', 'Error: ' + err.message, 'error');
  }
}

loadFAQs();


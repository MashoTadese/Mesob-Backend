var API   = window.location.origin + '/api';
var token = localStorage.getItem('mesob_admin_token');
if (!token) window.location.href = 'login.html';
var currentId = null;

function logout() {
  localStorage.removeItem('mesob_admin_token');
  window.location.href = 'login.html';
}

// ── Anonymous Complaints Toggle ──────────────────────────────
async function loadAnonSetting() {
  try {
    var res  = await fetch(API + '/content');
    var data = await res.json();
    var allowed = data.success && data.data && data.data.allow_anonymous_complaints !== false;
    updateAnonUI(allowed);
  } catch (e) { updateAnonUI(true); }
}

function updateAnonUI(allowed) {
  var toggle = document.getElementById('anonToggle');
  var track  = document.getElementById('anonTrack');
  var thumb  = document.getElementById('anonThumb');
  var text   = document.getElementById('anonStatusText');
  if (!toggle) return;
  toggle.checked = allowed;
  track.style.background = allowed ? '#059669' : '#e5e7eb';
  thumb.style.transform  = allowed ? 'translateX(24px)' : 'translateX(0)';
  text.textContent = allowed
    ? 'Citizens can submit complaints anonymously — currently ON'
    : 'Anonymous submissions disabled — citizens must provide their name — currently OFF';
  text.style.color = allowed ? '#059669' : '#dc2626';
}

async function toggleAnonymous() {
  var toggle  = document.getElementById('anonToggle');
  var allowed = toggle.checked;
  try {
    var res  = await fetch(API + '/content', {
      method:  'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ allow_anonymous_complaints: allowed }),
    });
    var data = await res.json();
    if (data.success) {
      updateAnonUI(allowed);
    } else {
      toggle.checked = !allowed; // revert
      alert('Failed to update setting: ' + data.message);
    }
  } catch (e) {
    toggle.checked = !allowed; // revert
    alert('Network error: ' + e.message);
  }
}

// Load setting on page load
loadAnonSetting();

// Escape HTML to prevent XSS when rendering user-submitted content
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmt(d) {
  return new Date(d).toLocaleString('en-US', {
    month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit'
  });
}

function showTableError(msg) {
  var tbody = document.getElementById('tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="empty" style="color:#dc2626">' + msg + '</td></tr>';
}

async function load() {
  var tbody = document.getElementById('tbody');
  try {
    var status = document.getElementById('statusFilter').value;
    var type   = document.getElementById('typeFilter').value;
    var search = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';
    var url    = API + '/complaints?limit=100';
    if (status) url += '&status=' + status;
    if (type)   url += '&type='   + type;

    tbody.innerHTML = '<tr><td colspan="7" class="empty">Loading...</td></tr>';

    var res  = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('Server error ' + res.status);
    var data = await res.json();

    var items = data.data || [];
    if (search) {
      var q = search.toLowerCase();
      items = items.filter(function(c) {
        return (c.refNumber && c.refNumber.toLowerCase().includes(q)) ||
               (c.fullName  && c.fullName.toLowerCase().includes(q))  ||
               (c.email     && c.email.toLowerCase().includes(q));
      });
    }

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No complaints found</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(function(c) {
      return '<tr>'
        + '<td><strong>' + c.refNumber + '</strong></td>'
        + '<td>' + (c.anonymous ? '<span class="anon">Anonymous</span>' : (c.fullName || '—')) + '</td>'
        + '<td style="font-size:12px">' + (c.department || '—') + '</td>'
        + '<td>' + (c.type || '—') + '</td>'
        + '<td><span class="badge ' + c.status + '" onclick="openModal(\'' + c._id + '\')">' + c.status.replace('_',' ') + '</span></td>'
        + '<td style="font-size:12px">' + fmt(c.createdAt) + '</td>'
        + '<td><button onclick="openModal(\'' + c._id + '\')" style="background:#EEF1FB;color:#1E3578;border:none;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">' + (c.status === 'pending' ? 'View' : 'Review') + '</button></td>'
        + '</tr>';
    }).join('');
  } catch (err) {
    showTableError('Failed to load: ' + err.message + '. Is the backend running?');
  }
}

async function openModal(id) {
  currentId = id;
  try {
    var res  = await fetch(API + '/complaints/' + id, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Server error ' + res.status);
    var data = await res.json();
    var c    = data.data;

    // Auto-change status: pending → under_review when admin opens/reads the complaint
    if (c.status === 'pending') {
      try {
        await fetch(API + '/complaints/' + id, {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'under_review' })
        });
        c.status = 'under_review'; // update local copy
      } catch (e) { /* non-critical, continue */ }
    }

    document.getElementById('modalContent').innerHTML =
      '<div class="detail-row"><label>Reference #</label><span><strong>' + escHtml(c.refNumber) + '</strong></span></div>'
      + '<div class="detail-row"><label>Complainant</label><span>' + (c.anonymous ? 'Anonymous' : escHtml(c.fullName)) + '</span></div>'
      + (!c.anonymous && c.email ? '<div class="detail-row"><label>Email</label><span>' + escHtml(c.email) + '</span></div>' : '')
      + (!c.anonymous && c.phone ? '<div class="detail-row"><label>Phone</label><span>' + escHtml(c.phone) + '</span></div>' : '')
      + '<div class="detail-row"><label>Department</label><span>' + escHtml(c.department) + '</span></div>'
      + '<div class="detail-row"><label>Type</label><span>' + escHtml(c.type) + '</span></div>'
      + '<div class="detail-row"><label>Submitted</label><span>' + fmt(c.createdAt) + '</span></div>'
      + '<p style="font-size:13px;font-weight:600;color:#374151;margin-top:8px">Complaint:</p>'
      + '<div class="complaint-text">' + escHtml(c.complaint) + '</div>'
      + (c.response ? '<p style="font-size:13px;font-weight:600;color:#059669;margin-top:8px">Previous Response:</p><div class="complaint-text" style="border-color:#d1fae5;background:#f0fdf4">' + escHtml(c.response) + '</div>' : '');

    document.getElementById('newStatus').value = c.status;
    document.getElementById('response').value  = c.response || '';
    document.getElementById('modal').classList.add('open');
  } catch (err) {
    alert('Failed to load complaint: ' + err.message);
  }
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  currentId = null;
}

async function updateComplaint() {
  try {
    var newStatus   = document.getElementById('newStatus').value;
    var newResponse = document.getElementById('response').value.trim();

    // Auto-set status to resolved when admin writes a response
    if (newResponse) {
      newStatus = 'resolved';
      document.getElementById('newStatus').value = 'resolved';
    }

    // Don't allow saving a blank response if there was already one — it would erase it
    var payload = { status: newStatus };
    if (newResponse) payload.response = newResponse;

    var res = await fetch(API + '/complaints/' + currentId, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Server error ' + res.status);
    var data = await res.json();
    if (data.success) {
      closeModal();
      load();
      if (newResponse) {
        if (data.emailSent) {
          alert('✅ Response saved!\n\n📧 Email notification sent to: ' + data.emailAddress + '\n\nStatus set to Resolved.');
        } else {
          var complaint = data.data;
          if (complaint.anonymous) {
            alert('✅ Response saved!\n\n⚠️ No email sent — this complaint was submitted anonymously.\n\nStatus set to Resolved.');
          } else if (!complaint.email) {
            alert('✅ Response saved!\n\n⚠️ No email sent — the citizen did not provide an email address.\n\nStatus set to Resolved.');
          } else {
            alert('✅ Response saved!\n\n⚠️ Email could not be sent to: ' + complaint.email + '\nPlease check the server email configuration.\n\nStatus set to Resolved.');
          }
        }
      } else {
        alert('✅ Complaint status updated.');
      }
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Failed to update: ' + err.message);
  }
}

async function deleteComplaint() {
  if (!confirm('Delete this complaint permanently? This cannot be undone.')) return;
  try {
    var res  = await fetch(API + '/complaints/' + currentId, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Server error ' + res.status);
    var data = await res.json();
    if (data.success) { closeModal(); load(); }
    else alert('Error: ' + data.message);
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
}

document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === document.getElementById('modal')) closeModal();
});

load();

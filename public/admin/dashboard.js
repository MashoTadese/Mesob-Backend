var API = window.location.origin + '/api';
var token = localStorage.getItem('mesob_admin_token');
var admin = JSON.parse(localStorage.getItem('mesob_admin') || '{}');

if (!token) window.location.href = 'login.html';

document.getElementById('adminName').textContent = admin.name || 'Admin';

function logout() {
  localStorage.removeItem('mesob_admin_token');
  localStorage.removeItem('mesob_admin');
  window.location.href = 'login.html';
}

function fmt(d) { return new Date(d).toLocaleDateString('en-US', {month:'short',day:'numeric'}); }

async function loadDashboard() {
  try {
    var res  = await fetch(API + '/admin/dashboard', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) { logout(); return; }
    var data = await res.json();
    if (!data.success) { logout(); return; }
    var s = data.data.stats;

    // Also fetch news count
    var newsCount = 0;
    try {
      var nr   = await fetch(API + '/news/admin/all?limit=1', { headers: { Authorization: 'Bearer ' + token } });
      var nd   = await nr.json();
      newsCount = nd.total || 0;
    } catch(e) {}

    document.getElementById('statsGrid').innerHTML =
      '<div class="stat-card"><div class="value">' + s.totalComplaints + '</div><div class="label" data-i18n="dash.totalComp">Total Complaints</div></div>'
      + '<div class="stat-card yellow"><div class="value">' + s.pendingComplaints + '</div><div class="label" data-i18n="dash.pending">Pending Review</div></div>'
      + '<div class="stat-card green"><div class="value">' + s.resolvedComplaints + '</div><div class="label" data-i18n="dash.resolved">Resolved</div></div>'
      + '<div class="stat-card"><div class="value">' + s.totalMessages + '</div><div class="label" data-i18n="dash.messages">Messages</div></div>'
      + '<div class="stat-card red"><div class="value">' + s.unreadMessages + '</div><div class="label" data-i18n="dash.unread">Unread</div></div>'
      + '<div class="stat-card"><div class="value">' + newsCount + '</div><div class="label" data-i18n="dash.newsPosts">News Posts</div></div>';

    // Re-apply translations after injecting HTML
    if (window.MESOB_PREFS) {
      window.MESOB_PREFS.applyAll(localStorage.getItem('mesob_admin_lang') || 'en');
    }

    document.getElementById('complaintsTable').innerHTML = (data.data.recentComplaints || []).length
      ? (data.data.recentComplaints || []).map(function(c) {
          return '<tr>'
            + '<td><strong>' + c.refNumber + '</strong></td>'
            + '<td>' + c.type + '</td>'
            + '<td><span class="badge ' + c.status + '">' + c.status.replace('_',' ') + '</span></td>'
            + '<td>' + fmt(c.createdAt) + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:20px">No complaints yet</td></tr>';

    document.getElementById('messagesTable').innerHTML = (data.data.recentMessages || []).length
      ? (data.data.recentMessages || []).map(function(m) {
          return '<tr>'
            + '<td>' + m.name + '</td>'
            + '<td>' + m.subject + '</td>'
            + '<td><span class="badge ' + (m.isRead ? 'read' : 'unread') + '">' + (m.isRead ? 'Read' : 'New') + '</span></td>'
            + '<td>' + fmt(m.createdAt) + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:20px">No messages yet</td></tr>';

  } catch(e) {
    document.getElementById('statsGrid').innerHTML = '<div style="color:#dc2626;padding:20px">Error loading dashboard: ' + e.message + '</div>';
  }
}

loadDashboard();


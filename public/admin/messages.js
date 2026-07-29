// ============================================================
// MESOB Superadmin - Messages & Complaints
// ============================================================

var API         = window.location.origin + '/api';
var token       = localStorage.getItem('mesob_admin_token');
if (!token) window.location.href = 'login.html';

var allItems    = [];
var currentItem = null;
var activeTab   = 'all';

function logout() {
  localStorage.removeItem('mesob_admin_token');
  localStorage.removeItem('mesob_admin');
  window.location.href = 'login.html';
}

function fmt(d) {
  return new Date(d).toLocaleString('en-US', {
    month:'short', day:'numeric', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Load both Contact and Complaint APIs
async function load() {
  try {
    var r1 = await fetch(API + '/contact?limit=100',    { headers:{ Authorization:'Bearer '+token } });
    var r2 = await fetch(API + '/complaints?limit=100', { headers:{ Authorization:'Bearer '+token } });
    var d1 = await r1.json();
    var d2 = await r2.json();

    var contacts   = d1.success ? (d1.data || []) : [];
    var complaints = d2.success ? (d2.data || []) : [];

    var nc = contacts.map(function(c) {
      return {
        _id:       c._id,
        source:    'contact',
        name:      c.name    || '-',
        email:     c.email   || '',
        phone:     c.phone   || '',
        subject:   c.subject || 'General Inquiry',
        message:   c.message || '',
        reply:     c.reply   || '',
        isRead:    !!c.isRead,
        createdAt: c.createdAt
      };
    });

    var nk = complaints.map(function(c) {
      return {
        _id:       c._id,
        source:    'complaint',
        name:      c.anonymous ? 'Anonymous' : (c.fullName || 'Unknown'),
        email:     c.anonymous ? '' : (c.email || ''),
        phone:     c.anonymous ? '' : (c.phone || ''),
        subject:   fmtType(c.type) + ' - ' + fmtDept(c.department),
        message:   c.complaint || '',
        reply:     c.response  || '',
        isRead:    c.status !== 'pending',
        anonymous: !!c.anonymous,
        status:    c.status,
        refNumber: c.refNumber,
        createdAt: c.createdAt
      };
    });

    allItems = nc.concat(nk).sort(function(a,b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    updateCounts();
    renderTable();
  } catch (err) {
    document.getElementById('tbody').innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:40px;color:#dc2626">Failed to load: ' + esc(err.message) + '</td></tr>';
  }
}

function fmtType(t) {
  var m = { delay:'Service Delay', conduct:'Staff Conduct', corruption:'Corruption',
            missing:'Missing Docs', wrong:'Wrong Info', access:'Accessibility', other:'Other' };
  return m[t] || t || 'Complaint';
}

function fmtDept(d) {
  if (!d) return '';
  return d.replace('window','Window ').replace('general','General');
}

// Tabs
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('active'); });
  var id = { all:'tabAll', contact:'tabContact', complaint:'tabComplaint' }[tab];
  document.getElementById(id).classList.add('active');
  renderTable();
}

function updateCounts() {
  var nc = allItems.filter(function(i){ return i.source==='contact';   }).length;
  var nk = allItems.filter(function(i){ return i.source==='complaint'; }).length;
  document.getElementById('cntAll').textContent       = allItems.length;
  document.getElementById('cntContact').textContent   = nc;
  document.getElementById('cntComplaint').textContent = nk;
  document.getElementById('statAll').textContent      = allItems.length;
  document.getElementById('statContact').textContent  = nc;
  document.getElementById('statComplaint').textContent= nk;
}

// Render Table
function renderTable() {
  var rf = document.getElementById('readFilter').value;
  var sq = document.getElementById('searchInput').value.toLowerCase().trim();

  var filtered = allItems.filter(function(item) {
    if (activeTab === 'contact'   && item.source !== 'contact')   return false;
    if (activeTab === 'complaint' && item.source !== 'complaint') return false;
    if (rf === 'unread' &&  item.isRead) return false;
    if (rf === 'read'   && !item.isRead) return false;
    if (sq) {
      var hay = (item.name+' '+item.subject+' '+item.email).toLowerCase();
      if (hay.indexOf(sq) === -1) return false;
    }
    return true;
  });

  if (!filtered.length) {
    document.getElementById('tbody').innerHTML =
      '<tr><td colspan="7"><div class="empty"><div class="e-icon">No messages found.</div></div></td></tr>';
    return;
  }

  document.getElementById('tbody').innerHTML = filtered.map(function(item) {
    // Source badge
    var src = item.source === 'contact'
      ? '<span class="badge b-contact">Contact</span>'
      : '<span class="badge b-complaint">Complaint</span>';

    // Read badge
    var read = item.isRead
      ? '<span class="badge b-read">Read</span>'
      : '<span class="badge b-new">New</span>';

    // Reply badge
    var rep = item.reply
      ? '<span class="badge b-replied">Replied</span>'
      : '<span style="color:#9ca3af;font-size:11px">-</span>';

    // For complaints show status badge too
    if (item.source === 'complaint' && item.status) {
      var statusColors = { pending:'#d97706', under_review:'#1d4ed8', resolved:'#059669', rejected:'#dc2626' };
      var sc = statusColors[item.status] || '#6b7280';
      read = '<span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;background:#f3f4f6;color:' + sc + '">'
           + item.status.replace('_',' ').toUpperCase() + '</span>';
    }

    var init = (item.name || 'A').charAt(0).toUpperCase();
    var name = '<div style="display:flex;align-items:center;gap:8px">'
      + (!item.isRead ? '<span class="dot"></span>' : '')
      + '<span class="avatar">' + init + '</span>'
      + '<div>'
      +   '<div style="font-weight:600;font-size:13px">' + esc(item.name) + '</div>'
      +   (item.email ? '<div style="font-size:11px;color:#9ca3af">' + esc(item.email) + '</div>' : '<div style="font-size:11px;color:#9ca3af;font-style:italic">Anonymous</div>')
      + '</div></div>';

    var subj = '<div style="font-weight:500;color:#111827;font-size:13px">' + esc(item.subject) + '</div>'
      + (item.refNumber ? '<div style="font-size:10px;color:#9ca3af;margin-top:2px">Ref: ' + esc(item.refNumber) + '</div>' : '');

    var acts = '<div class="row-actions">'
      + '<button class="btn-sm btn-view" onclick="openView(\'' + item._id + '\')">View</button>'
      + (item.source === 'contact' && item.email ? '<button class="btn-sm btn-reply" onclick="openReply(\'' + item._id + '\')">Reply</button>' : '')
      + '<button class="btn-sm btn-del" onclick="deleteItem(\'' + item._id + '\',\'' + item.source + '\')">Delete</button>'
      + '</div>';

    return '<tr class="' + (item.isRead ? '' : 'unread') + '">'
      + '<td>' + src + '</td>'
      + '<td>' + name + '</td>'
      + '<td>' + subj + '</td>'
      + '<td>' + read + '</td>'
      + '<td>' + rep  + '</td>'
      + '<td style="font-size:11px;color:#9ca3af;white-space:nowrap">' + fmt(item.createdAt) + '</td>'
      + '<td>' + acts + '</td>'
      + '</tr>';
  }).join('');
}

// View Modal
async function openView(id) {
  var item = allItems.find(function(i){ return i._id === id; });
  if (!item) return;
  currentItem = item;

  document.getElementById('viewTitle').textContent =
    item.source === 'contact' ? 'Contact Us Message' : 'Customer Complaint';
  document.getElementById('viewSrcBadge').innerHTML = item.source === 'contact'
    ? '<span class="badge b-contact">Contact Us</span>'
    : '<span class="badge b-complaint">Complaint</span>';

  var html = '<div class="meta-grid">';
  html += '<span class="m-lbl">From</span><span class="m-val">' + esc(item.name) + '</span>';
  if (item.email) html += '<span class="m-lbl">Email</span><span class="m-val"><a href="mailto:' + esc(item.email) + '">' + esc(item.email) + '</a></span>';
  if (item.phone) html += '<span class="m-lbl">Phone</span><span class="m-val">' + esc(item.phone) + '</span>';
  html += '<span class="m-lbl">Subject</span><span class="m-val">' + esc(item.subject) + '</span>';
  if (item.refNumber) html += '<span class="m-lbl">Ref #</span><span class="m-val" style="color:#0f1f5c;font-weight:700">' + esc(item.refNumber) + '</span>';
  if (item.status) {
    var sc2 = { pending:'#d97706', under_review:'#1d4ed8', resolved:'#059669', rejected:'#dc2626' }[item.status] || '#6b7280';
    html += '<span class="m-lbl">Status</span><span class="m-val" style="color:' + sc2 + ';font-weight:700">' + item.status.replace('_',' ').toUpperCase() + '</span>';
  }
  html += '<span class="m-lbl">Date</span><span class="m-val">' + fmt(item.createdAt) + '</span>';
  html += '</div>';

  html += '<p class="sec-title">Message</p>';
  html += '<div class="msg-body">' + esc(item.message).replace(/\n/g,'<br>') + '</div>';

  if (item.reply) {
    html += '<p class="sec-title" style="color:#16a34a">Your Reply</p>';
    html += '<div class="reply-body">' + esc(item.reply).replace(/\n/g,'<br>') + '</div>';
  }

  if (item.source === 'complaint') {
    html += '<div style="margin-top:16px;background:#f0f4ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px 16px;font-size:13px;color:#374151;line-height:1.6">'
      + '<strong style="color:#0f1f5c">Note:</strong> To respond to this complaint or update its status, '
      + 'please go to the <a href="complaints.html" style="color:#0f1f5c;font-weight:700;text-decoration:underline">Complaints page</a>.'
      + '</div>';
  }

  document.getElementById('viewContent').innerHTML = html;
  document.getElementById('viewReplyBtn').style.display  = (item.source === 'contact' && item.email) ? '' : 'none';
  document.getElementById('viewDeleteBtn').style.display = '';
  document.getElementById('viewOverlay').classList.add('open');

  if (item.source === 'contact' && !item.isRead) {
    try {
      await fetch(API + '/contact/' + id + '/read', { method:'PUT', headers:{ Authorization:'Bearer '+token } });
      item.isRead = true;
      renderTable();
    } catch(e) {}
  }
}

function openReplyFromView() { closeView(); if (currentItem) openReply(currentItem._id); }
function closeView() { document.getElementById('viewOverlay').classList.remove('open'); }

// Reply Modal
function openReply(id) {
  var item = allItems.find(function(i){ return i._id === id; });
  if (!item || item.source !== 'contact' || !item.email) return;
  currentItem = item;
  document.getElementById('replyInfo').innerHTML =
    '<strong>To:</strong> ' + esc(item.name) + ' &lt;' + esc(item.email) + '&gt;<br>'
    + '<strong>Subject:</strong> Re: ' + esc(item.subject);
  document.getElementById('replyText').value = '';
  document.getElementById('replyErr').style.display = 'none';
  document.getElementById('replyOverlay').classList.add('open');
}

function closeReply() { document.getElementById('replyOverlay').classList.remove('open'); }

async function sendReply() {
  var text = document.getElementById('replyText').value.trim();
  if (!text) { document.getElementById('replyErr').style.display = 'block'; return; }
  if (!currentItem || currentItem.source !== 'contact') { alert('Complaints must be replied to from the Complaints page.'); return; }

  var btn = document.getElementById('sendBtn');
  btn.textContent = 'Sending...'; btn.disabled = true;

  try {
    var res  = await fetch(API + '/contact/' + currentItem._id + '/reply', {
      method:  'POST',
      headers: { Authorization:'Bearer '+token, 'Content-Type':'application/json' },
      body:    JSON.stringify({ replyText: text })
    });
    var data = await res.json();
    btn.textContent = 'Send Reply'; btn.disabled = false;
    if (data.success) {
      closeReply();
      currentItem.reply  = text;
      currentItem.isRead = true;
      updateCounts();
      renderTable();
      alert('Reply sent to ' + currentItem.email);
    } else {
      alert('Error: ' + (data.message || 'Failed to send.'));
    }
  } catch (err) {
    btn.textContent = 'Send Reply'; btn.disabled = false;
    alert('Network error: ' + err.message);
  }
}

// Delete
async function deleteItem(id, source) {
  var label = source === 'contact' ? 'contact message' : 'complaint';
  if (!confirm('Delete this ' + label + ' permanently?')) return;
  try {
    var url = source === 'contact' ? API + '/contact/' + id : API + '/complaints/' + id;
    var res  = await fetch(url, { method:'DELETE', headers:{ Authorization:'Bearer '+token } });
    var data = await res.json();
    if (data.success) {
      allItems = allItems.filter(function(i){ return i._id !== id; });
      updateCounts(); renderTable(); closeView();
    } else { alert('Failed: ' + data.message); }
  } catch(err) { alert('Error: ' + err.message); }
}

function deleteCurrent() { if (currentItem) deleteItem(currentItem._id, currentItem.source); }

// Backdrop
document.getElementById('viewOverlay').addEventListener('click', function(e) { if (e.target === this) closeView(); });
document.getElementById('replyOverlay').addEventListener('click', function(e) { if (e.target === this) closeReply(); });

// Init
load();

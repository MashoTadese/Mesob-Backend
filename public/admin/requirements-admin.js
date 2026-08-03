// ============================================================
// MESOB Superadmin - Service Requirements Admin
// Admin can add / edit / delete requirements for each service
// ============================================================

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

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── STATE ──
var allReqs    = [];
var editingId  = null;
var searchTerm = '';

// ── LOAD ──
async function loadRequirements() {
  try {
    // Fetch both requirements and the service order from windows
    var [reqRes, winRes] = await Promise.all([
      fetch(API + '/requirements'),
      fetch(API + '/services')
    ]);
    var reqData = await reqRes.json();
    var winData = await winRes.json();

    var rawReqs = reqData.success ? reqData.data : [];

    // Build an ordered map: serviceName → position based on windows service order
    var orderMap = {};
    var winOrderMap = {}; // serviceName → windowOrder
    var pos = 0;
    if (winData.success && winData.data) {
      winData.data.forEach(function(win) {
        // Use servicesEN directly (accurate English names from DB)
        (win.servicesEN || win.services || []).forEach(function(svc) {
          if (svc) {
            orderMap[svc.toLowerCase()] = pos++;
            winOrderMap[svc.toLowerCase()] = win.windowId || win.order || 0;
          }
        });
      });
    }

    // Sort requirements to match the window service order
    rawReqs.sort(function(a, b) {
      var wa = getWinNum(a.window);
      var wb = getWinNum(b.window);
      if (wa !== wb) return wa - wb;
      // Within same window, sort by service list order
      var posA = orderMap[a.serviceName.toLowerCase()];
      var posB = orderMap[b.serviceName.toLowerCase()];
      if (posA !== undefined && posB !== undefined) return posA - posB;
      if (posA !== undefined) return -1;
      if (posB !== undefined) return 1;
      return a.serviceName.localeCompare(b.serviceName);
    });

    allReqs = rawReqs;
    renderList();
    document.getElementById('totalCount').textContent = allReqs.length + ' requirements';
  } catch(e) {
    showAlert('listAlert', 'Failed to load: ' + e.message, 'error');
  }
}

// Extract window number for sorting
function getWinNum(windowStr) {
  if (!windowStr) return 99;
  var m = windowStr.match(/Window\s*(\d+)/i) || windowStr.match(/(\d+)/);
  return m ? parseInt(m[1]) : 99;
}

// Extract English service name from bilingual format
function getServiceEN(svc) {
  if (!svc) return '';
  var dashIdx = svc.lastIndexOf(' - ');
  if (dashIdx !== -1) {
    var after = svc.slice(dashIdx + 3).trim();
    if (!after.includes(')')) return after;
  }
  var lo = svc.lastIndexOf('('), lc = svc.lastIndexOf(')');
  if (lo !== -1 && lc > lo) return svc.slice(lo + 1, lc).trim();
  return svc;
}

// ── RENDER LIST ──
function renderList() {
  var el   = document.getElementById('reqList');
  var term = searchTerm.toLowerCase();
  var filtered = term
    ? allReqs.filter(function(r) { return r.serviceName.toLowerCase().includes(term) || (r.window || '').toLowerCase().includes(term); })
    : allReqs;

  if (!filtered.length) {
    el.innerHTML = '<p class="empty-msg">' + (term ? 'No results for "' + escHtml(term) + '"' : 'No requirements yet.') + '</p>';
    return;
  }

  // Group by window
  var groups = {};
  var groupOrder = [];
  filtered.forEach(function(r) {
    var winLabel = r.window || 'Unknown Window';
    var winNum   = getWinNum(winLabel);
    var key      = winNum + '||' + winLabel;
    if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
    groups[key].push(r);
  });

  // Sort groups by window number
  groupOrder.sort(function(a, b) {
    return parseInt(a.split('||')[0]) - parseInt(b.split('||')[0]);
  });

  var html = '';
  groupOrder.forEach(function(key) {
    var winLabel = key.split('||')[1];
    var items    = groups[key];
    html += '<div class="win-group">'
      + '<div class="win-group-header">' + escHtml(winLabel) + ' <span class="win-group-count">' + items.length + ' service' + (items.length > 1 ? 's' : '') + '</span></div>'
      + items.map(function(r) {
          return '<div class="req-row">'
            + '<div class="req-info">'
            +   '<div class="req-name">' + escHtml(r.serviceName) + '</div>'
            +   '<div class="req-meta">'
            +     '<span class="meta-badge">Time: ' + escHtml(r.processingTimeEN || r.processingTime || '—') + '</span>'
            +     '<span class="meta-badge">Fee: ' + escHtml(r.feeEN || r.fee || '—') + '</span>'
            +     '<span class="meta-badge">' + ((r.requirementsEN && r.requirementsEN.length) || (r.requirements && r.requirements.length) || 0) + ' docs</span>'
            +     '<span class="meta-badge">' + ((r.stepsEN && r.stepsEN.length) || (r.steps && r.steps.length) || 0) + ' steps</span>'
            +     '<span class="meta-badge" style="color:#059669">EN ' + (r.requirementsEN && r.requirementsEN.length ? 'done' : 'empty') + '</span>'
            +     '<span class="meta-badge" style="color:#0f1f5c">AM ' + (r.requirementsAM && r.requirementsAM.length ? 'done' : 'empty') + '</span>'
            +     '<span class="meta-badge" style="color:#6b7280">OR ' + (r.requirementsOR && r.requirementsOR.length ? 'done' : 'empty') + '</span>'
            +   '</div>'
            + '</div>'
            + '<div class="req-actions">'
            +   '<button class="btn-sm btn-edit" onclick="openEditor(\'' + r._id + '\')">Edit</button>'
            +   '<button class="btn-sm btn-del"  onclick="deleteReq(\'' + r._id + '\', \'' + escHtml(r.serviceName) + '\')">Delete</button>'
            + '</div>'
            + '</div>';
        }).join('')
      + '</div>';
  });

  el.innerHTML = html;
}

// ── SEARCH ──
document.getElementById('searchInput').addEventListener('input', function() {
  searchTerm = this.value;
  renderList();
});

// ── LANGUAGE TABS ──
function switchLangTab(lang) {
  document.querySelectorAll('.lang-tab').forEach(function(t) {
    t.classList.toggle('active', t.getAttribute('data-lang') === lang);
  });
  document.querySelectorAll('.lang-panel').forEach(function(p) {
    p.style.display = p.id === 'panel-' + lang ? 'block' : 'none';
  });
}

// ── EDITOR ──
function openEditor(id) {
  editingId = id || null;
  var r = id ? allReqs.find(function(x) { return x._id === id; }) : null;

  document.getElementById('editorTitle').textContent    = r ? 'Edit: ' + r.serviceName : 'Add New Requirement';
  document.getElementById('reqServiceName').value        = r ? r.serviceName    : '';
  document.getElementById('reqWindow').value             = r ? (r.window || '') : '';

  // English fields
  document.getElementById('reqTimeEN').value  = r ? (r.processingTimeEN || r.processingTime || '') : '';
  document.getElementById('reqFeeEN').value   = r ? (r.feeEN  || r.fee  || '') : '';
  document.getElementById('reqDocsEN').value  = r ? (r.requirementsEN  || r.requirements  || []).join('\n') : '';
  document.getElementById('reqStepsEN').value = r ? (r.stepsEN || r.steps || []).join('\n') : '';

  // Amharic fields
  document.getElementById('reqTimeAM').value  = r ? (r.processingTimeAM || '') : '';
  document.getElementById('reqFeeAM').value   = r ? (r.feeAM  || '') : '';
  document.getElementById('reqDocsAM').value  = r ? (r.requirementsAM  || []).join('\n') : '';
  document.getElementById('reqStepsAM').value = r ? (r.stepsAM || []).join('\n') : '';

  // Afaan Oromo fields
  document.getElementById('reqTimeOR').value  = r ? (r.processingTimeOR || '') : '';
  document.getElementById('reqFeeOR').value   = r ? (r.feeOR  || '') : '';
  document.getElementById('reqDocsOR').value  = r ? (r.requirementsOR  || []).join('\n') : '';
  document.getElementById('reqStepsOR').value = r ? (r.stepsOR || []).join('\n') : '';

  // Reset to English tab
  switchLangTab('EN');

  document.getElementById('listView').style.display   = 'none';
  document.getElementById('editorView').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeEditor() {
  editingId = null;
  document.getElementById('editorView').style.display = 'none';
  document.getElementById('listView').style.display   = 'block';
}

// ── SAVE ──
document.getElementById('reqForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = this.querySelector('[type="submit"]');
  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }

  var serviceName = document.getElementById('reqServiceName').value.trim();
  if (!serviceName) {
    showAlert('editorAlert', 'Service name is required.', 'error');
    if (btn) { btn.textContent = 'Save'; btn.disabled = false; }
    return;
  }

  var payload = {
    serviceName:      serviceName,
    window:           document.getElementById('reqWindow').value,
    windowOrder:      parseInt(document.getElementById('reqWindow').value.match(/Window\s*(\d+)/i)?.[1] || '99'),
    requirementsEN:   document.getElementById('reqDocsEN').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean),
    requirementsAM:   document.getElementById('reqDocsAM').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean),
    requirementsOR:   document.getElementById('reqDocsOR').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean),
    processingTimeEN: document.getElementById('reqTimeEN').value.trim(),
    processingTimeAM: document.getElementById('reqTimeAM').value.trim(),
    processingTimeOR: document.getElementById('reqTimeOR').value.trim(),
    feeEN:            document.getElementById('reqFeeEN').value.trim(),
    feeAM:            document.getElementById('reqFeeAM').value.trim(),
    feeOR:            document.getElementById('reqFeeOR').value.trim(),
    stepsEN:          document.getElementById('reqStepsEN').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean),
    stepsAM:          document.getElementById('reqStepsAM').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean),
    stepsOR:          document.getElementById('reqStepsOR').value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean),
  };

  try {
    var url    = editingId ? API + '/requirements/' + editingId : API + '/requirements';
    var method = editingId ? 'PUT' : 'POST';
    var res    = await fetch(url, {
      method:  method,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    if (res.status === 401) { alert('Session expired. Please log in again.'); window.location.href = 'login.html'; return; }
    var data = await res.json();
    if (data.success) {
      showAlert('listAlert', serviceName + ' saved successfully!', 'success');
      closeEditor();
      loadRequirements();
    } else {
      showAlert('editorAlert', data.message || 'Save failed', 'error');
    }
  } catch(err) {
    showAlert('editorAlert', 'Error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.textContent = 'Save'; btn.disabled = false; }
  }
});

// ── DELETE ──
async function deleteReq(id, name) {
  if (!confirm('Delete requirements for "' + name + '"?')) return;
  try {
    var res  = await fetch(API + '/requirements/' + id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    var data = await res.json();
    if (data.success) {
      showAlert('listAlert', 'Deleted.', 'success');
      loadRequirements();
    } else {
      showAlert('listAlert', data.message || 'Delete failed', 'error');
    }
  } catch(err) {
    showAlert('listAlert', 'Error: ' + err.message, 'error');
  }
}

// ── INIT ──
loadRequirements();

// ============================================================
// MESOB Superadmin - News Management
// ============================================================
var API   = window.location.origin + '/api';
var token = localStorage.getItem('mesob_admin_token');
if (!token) window.location.href = 'login.html';

var editingId   = null;
var currentType = 'text';

function logout() {
  localStorage.removeItem('mesob_admin_token');
  localStorage.removeItem('mesob_admin');
  window.location.href = 'login.html';
}

function showAlert(msg, type) {
  var el = document.getElementById('formAlert');
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert ' + type;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 5000);
}

function fmt(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Type selector
function setType(type) {
  currentType = type;
  document.querySelectorAll('.type-btn').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-type') === type);
  });
  var img = document.getElementById('imageSection');
  var vid = document.getElementById('videoSection');
  if (img) img.classList.toggle('show', type === 'image');
  if (vid) vid.classList.toggle('show', type === 'video');
}

// Image preview — single or multiple
function previewImages(input) {
  var files = input.files;
  if (!files || !files.length) return;
  // Show first image in main preview box
  var reader = new FileReader();
  reader.onload = function(e) {
    var preview = document.getElementById('imgPreview');
    if (preview) preview.innerHTML = '<img src="' + e.target.result + '">';
  };
  reader.readAsDataURL(files[0]);
  // Show thumbnails grid
  var grid = document.getElementById('imgPreviewGrid');
  if (grid) {
    grid.innerHTML = '';
    Array.from(files).forEach(function(file, i) {
      var r = new FileReader();
      r.onload = function(e) {
        var thumb = document.createElement('div');
        thumb.style.cssText = 'position:relative;width:60px;height:60px;border-radius:8px;overflow:hidden;border:2px solid #e5e7eb;flex-shrink:0;';
        thumb.innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover">'
          + '<span style="position:absolute;bottom:1px;right:2px;font-size:9px;font-weight:700;background:rgba(0,0,0,0.55);color:#fff;padding:1px 3px;border-radius:3px">' + (i+1) + '</span>';
        grid.appendChild(thumb);
      };
      r.readAsDataURL(file);
    });
  }
}

// YouTube ID extractor
function extractYouTubeId(url) {
  var patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = url.match(patterns[i]);
    if (m) return m[1];
  }
  return '';
}

// YouTube live preview on input
document.addEventListener('DOMContentLoaded', function() {
  var vidInput = document.getElementById('videoUrl');
  if (vidInput) {
    vidInput.addEventListener('input', function() {
      var url  = this.value.trim();
      var vid  = extractYouTubeId(url);
      var prev = document.getElementById('videoPreview');
      var frm  = document.getElementById('videoFrame');
      if (vid) {
        if (frm)  frm.src = 'https://www.youtube.com/embed/' + vid;
        if (prev) prev.style.display = 'block';
      } else {
        if (frm)  frm.src = '';
        if (prev) prev.style.display = 'none';
      }
    });
  }
});

// Load all news (admin view)
async function loadNews() {
  var list = document.getElementById('newsList');
  try {
    var res  = await fetch(API + '/news/admin/all', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Server error ' + res.status);
    var data = await res.json();

    if (!data.success || !data.data || !data.data.length) {
      list.innerHTML = '<div class="empty-news">No news posts yet. Create your first one.</div>';
      return;
    }

    var BASE = window.location.origin;
    list.innerHTML = data.data.map(function(n) {
      var typeLabel = n.type === 'image' ? 'Image' : n.type === 'video' ? 'Video' : 'Text';
      var firstImg  = (n.imageUrls && n.imageUrls.length > 0) ? n.imageUrls[0] : n.imageUrl;
      var imgCount  = (n.imageUrls && n.imageUrls.length > 1) ? ' <span style="font-size:9px;background:#0f1f5c;color:#fff;padding:1px 5px;border-radius:10px">+' + (n.imageUrls.length - 1) + '</span>' : '';
      var thumb = firstImg
        ? '<img src="' + BASE + firstImg + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:6px">'
        : (n.type === 'video' ? '[Video]' : '[Text]');

      return '<div class="news-item">'
        + '<div class="news-thumb" style="position:relative">' + thumb + imgCount + '</div>'
        + '<div class="news-info">'
        +   '<div class="ni-title">' + escHtml(n.titleEN) + '</div>'
        +   '<div class="ni-meta">'
        +     '<span class="type-badge type-' + n.type + '">' + typeLabel + '</span>'
        +     '<span class="pub-badge ' + (n.isPublished ? 'pub-yes' : 'pub-no') + '">'
        +       (n.isPublished ? 'Published' : 'Draft')
        +     '</span>'
        +     '<span>' + fmt(n.createdAt) + '</span>'
        +   '</div>'
        + '</div>'
        + '<div class="news-actions">'
        +   '<button class="btn-icon btn-edit"  onclick="editPost(\'' + n._id + '\')">Edit</button>'
        +   '<button class="btn-icon ' + (n.isPublished ? 'btn-unpub' : 'btn-pub') + '" onclick="togglePub(\'' + n._id + '\')">'
        +     (n.isPublished ? 'Unpublish' : 'Publish')
        +   '</button>'
        +   '<button class="btn-icon btn-del" onclick="delPost(\'' + n._id + '\')">Delete</button>'
        + '</div>'
        + '</div>';
    }).join('');
  } catch (err) {
    list.innerHTML = '<div class="empty-news">Error: ' + escHtml(err.message) + '</div>';
  }
}

// Save post (create or update)
async function savePost() {
  var btn     = document.querySelector('.save-btn');
  var titleEl = document.getElementById('titleEN');
  var titleEN = titleEl ? titleEl.value.trim() : '';

  if (!titleEN) {
    if (titleEl) { titleEl.style.border = '2px solid #dc2626'; titleEl.focus(); }
    showAlert('Title (English) is required — fill in the first field.', 'error');
    return;
  }
  if (titleEl) titleEl.style.border = '';
  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }

  var fd = new FormData();
  fd.append('titleEN', titleEN);
  fd.append('titleAM', (document.getElementById('titleAM') || {value:''}).value.trim());
  fd.append('titleOR', (document.getElementById('titleOR') || {value:''}).value.trim());
  fd.append('bodyEN',  (document.getElementById('bodyEN')  || {value:''}).value.trim());
  fd.append('bodyAM',  (document.getElementById('bodyAM')  || {value:''}).value.trim());
  fd.append('bodyOR',  (document.getElementById('bodyOR')  || {value:''}).value.trim());
  fd.append('type',        currentType);
  fd.append('category',    (document.getElementById('category') || {value:'General'}).value);
  fd.append('isPublished', document.getElementById('isPublished').checked ? 'true' : 'false');

  if (currentType === 'video') {
    fd.append('videoUrl', (document.getElementById('videoUrl') || {value:''}).value.trim());
  }
  if (currentType === 'image') {
    var imgFiles = document.getElementById('imageInput').files;
    if (imgFiles && imgFiles.length > 0) {
      Array.from(imgFiles).forEach(function(file) {
        fd.append('images', file);
      });
    }
  }

  try {
    var url    = editingId ? API + '/news/' + editingId : API + '/news';
    var method = editingId ? 'PUT' : 'POST';
    var res    = await fetch(url, {
      method:  method,
      headers: { Authorization: 'Bearer ' + token },
      body:    fd
    });
    var data = await res.json();
    if (data.success) {
      showAlert(editingId ? 'Post updated successfully!' : 'Post published successfully!', 'success');
      resetForm();
      loadNews();
    } else {
      showAlert(data.message || 'Save failed.', 'error');
    }
  } catch (err) {
    showAlert('Network error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.textContent = 'Save Post'; btn.disabled = false; }
  }
}

// Edit post — fetch single post by ID directly
async function editPost(id) {
  try {
    var res  = await fetch(API + '/news/admin/' + id, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Server error ' + res.status);
    var data = await res.json();
    var n    = data.data;
    if (!n) { alert('Post not found'); return; }

    editingId = id;
    document.getElementById('formTitle').textContent = 'Edit Post';
    document.getElementById('formSub').textContent   = 'Editing: ' + n.titleEN;

    document.getElementById('titleEN').value = n.titleEN || '';
    document.getElementById('titleAM').value = n.titleAM || '';
    document.getElementById('titleOR').value = n.titleOR || '';
    document.getElementById('bodyEN').value  = n.bodyEN  || '';
    document.getElementById('bodyAM').value  = n.bodyAM  || '';
    document.getElementById('bodyOR').value  = n.bodyOR  || '';
    document.getElementById('category').value      = n.category || 'General';
    document.getElementById('isPublished').checked = !!n.isPublished;

    var vidInput = document.getElementById('videoUrl');
    if (vidInput) {
      vidInput.value = n.videoUrl
        ? n.videoUrl.replace('https://www.youtube.com/embed/', 'https://www.youtube.com/watch?v=')
        : '';
    }

    setType(n.type || 'text');

    if (n.imageUrl) {
      var prev = document.getElementById('imgPreview');
      if (prev) prev.innerHTML = '<img src="' + window.location.origin + n.imageUrl + '" style="width:100%;height:100%;object-fit:cover">';
    }
    if (n.videoUrl) {
      var frm   = document.getElementById('videoFrame');
      var prev2 = document.getElementById('videoPreview');
      if (frm)   frm.src = n.videoUrl;
      if (prev2) prev2.style.display = 'block';
    }

    document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showAlert('Error loading post: ' + err.message, 'error');
  }
}

// Toggle publish/unpublish
async function togglePub(id) {
  try {
    var res  = await fetch(API + '/news/' + id + '/publish', {
      method: 'PUT', headers: { Authorization: 'Bearer ' + token }
    });
    var data = await res.json();
    if (data.success) loadNews();
    else alert('Error: ' + data.message);
  } catch (err) { alert('Error: ' + err.message); }
}

// Delete post
async function delPost(id) {
  if (!confirm('Delete this news post permanently?')) return;
  try {
    var res  = await fetch(API + '/news/' + id, {
      method: 'DELETE', headers: { Authorization: 'Bearer ' + token }
    });
    var data = await res.json();
    if (data.success) { if (editingId === id) resetForm(); loadNews(); }
    else alert('Error: ' + data.message);
  } catch (err) { alert('Error: ' + err.message); }
}

// Reset form
function resetForm() {
  editingId = null;
  document.getElementById('formTitle').textContent = 'New Post';
  document.getElementById('formSub').textContent   = 'Fill in the details and publish';

  ['titleEN','titleAM','titleOR','bodyEN','bodyAM','bodyOR','videoUrl'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.value = ''; el.style.border = ''; }
  });

  var cat = document.getElementById('category');
  if (cat) cat.value = 'General';
  var pub = document.getElementById('isPublished');
  if (pub) pub.checked = false;
  var imgInput = document.getElementById('imageInput');
  if (imgInput) imgInput.value = '';
  var imgPrev = document.getElementById('imgPreview');
  if (imgPrev) imgPrev.innerHTML = '📷';
  var imgGrid = document.getElementById('imgPreviewGrid');
  if (imgGrid) imgGrid.innerHTML = '';
  var vidPrev = document.getElementById('videoPreview');
  if (vidPrev) vidPrev.style.display = 'none';
  var vidFrame = document.getElementById('videoFrame');
  if (vidFrame) vidFrame.src = '';
  var alertEl = document.getElementById('formAlert');
  if (alertEl) alertEl.style.display = 'none';

  setType('text');
}

// Init
loadNews();

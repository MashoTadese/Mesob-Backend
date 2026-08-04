// ============================================================
// MESOB Superadmin - Gallery Management
// ============================================================
var API   = window.location.origin + '/api';
var token = localStorage.getItem('mesob_admin_token');
if (!token) window.location.href = 'login.html';

var editingId = null;

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
  setTimeout(function() { el.style.display = 'none'; }, 4000);
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getImgSrc(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : window.location.origin + url;
}

// Preview selected image
function previewImage(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var prev = document.getElementById('imgPreview');
    if (prev) prev.innerHTML = '<img src="' + e.target.result + '">';
  };
  reader.readAsDataURL(file);
}

// Load all photos
async function loadGallery() {
  var grid = document.getElementById('galleryGrid');
  try {
    var res  = await fetch(API + '/gallery/admin/all', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Server error ' + res.status);
    var data = await res.json();
    var photos = data.data || [];

    document.getElementById('photoCount').textContent = photos.length;

    if (!photos.length) {
      grid.innerHTML = '<div class="empty-gallery">No photos yet. Upload your first one.</div>';
      return;
    }

    grid.innerHTML = photos.map(function(p) {
      var title = p.titleEN || p.titleAM || p.titleOR || '(No title)';
      return '<div class="photo-card">'
        + '<span class="pub-badge ' + (p.isPublished ? 'pub-yes' : 'pub-no') + '">' + (p.isPublished ? 'Live' : 'Draft') + '</span>'
        + '<img src="' + getImgSrc(p.imageUrl) + '" alt="' + escHtml(title) + '" onerror="this.style.background=\'#f3f4f6\'">'
        + '<div class="photo-info">'
        +   '<div class="photo-title">' + escHtml(title) + '</div>'
        +   '<div class="photo-meta">' + escHtml(p.category) + '</div>'
        + '</div>'
        + '<div class="photo-actions">'
        +   '<button class="btn-sm btn-pub" onclick="togglePub(\'' + p._id + '\')">' + (p.isPublished ? 'Unpublish' : 'Publish') + '</button>'
        +   '<button class="btn-sm" style="background:#f0f4ff;color:#0f1f5c" onclick="editPhoto(\'' + p._id + '\')">Edit</button>'
        +   '<button class="btn-sm btn-del" onclick="deletePhoto(\'' + p._id + '\', \'' + escHtml(title) + '\')">Delete</button>'
        + '</div>'
        + '</div>';
    }).join('');
  } catch (err) {
    grid.innerHTML = '<div class="empty-gallery">Error: ' + escHtml(err.message) + '</div>';
  }
}

// Save (upload or update)
async function savePhoto() {
  var btn = document.querySelector('.save-btn');
  var imgInput = document.getElementById('imageInput');

  if (!editingId && (!imgInput.files || !imgInput.files[0])) {
    showAlert('Please select a photo to upload.', 'error');
    return;
  }

  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }

  var fd = new FormData();
  if (imgInput.files && imgInput.files[0]) fd.append('image', imgInput.files[0]);
  fd.append('titleEN',     document.getElementById('titleEN').value.trim());
  fd.append('titleAM',     document.getElementById('titleAM').value.trim());
  fd.append('titleOR',     document.getElementById('titleOR').value.trim());
  fd.append('category',    document.getElementById('category').value);
  fd.append('isPublished', document.getElementById('isPublished').checked ? 'true' : 'false');

  try {
    var url    = editingId ? API + '/gallery/' + editingId : API + '/gallery';
    var method = editingId ? 'PUT' : 'POST';
    var res    = await fetch(url, {
      method:  method,
      headers: { Authorization: 'Bearer ' + token },
      body:    fd
    });
    var data = await res.json();
    if (data.success) {
      showAlert(editingId ? 'Photo updated!' : 'Photo uploaded!', 'success');
      resetForm();
      loadGallery();
    } else {
      showAlert(data.message || 'Failed.', 'error');
    }
  } catch (err) {
    showAlert('Error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.textContent = 'Upload Photo'; btn.disabled = false; }
  }
}

// Edit photo — fill form
var allPhotos = [];
async function editPhoto(id) {
  try {
    var res  = await fetch(API + '/gallery/admin/all', {
      headers: { Authorization: 'Bearer ' + token }
    });
    var data = await res.json();
    var photo = (data.data || []).find(function(p) { return p._id === id; });
    if (!photo) { alert('Photo not found'); return; }

    editingId = id;
    document.getElementById('formTitle').textContent = 'Edit Photo';
    document.getElementById('formSub').textContent   = 'Update details';
    document.getElementById('titleEN').value   = photo.titleEN || '';
    document.getElementById('titleAM').value   = photo.titleAM || '';
    document.getElementById('titleOR').value   = photo.titleOR || '';
    document.getElementById('category').value  = photo.category || 'General';
    document.getElementById('isPublished').checked = !!photo.isPublished;

    var prev = document.getElementById('imgPreview');
    if (prev) prev.innerHTML = '<img src="' + getImgSrc(photo.imageUrl) + '">';

    document.querySelector('.save-btn').textContent = 'Save Changes';
    document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Toggle publish
async function togglePub(id) {
  try {
    var res  = await fetch(API + '/gallery/' + id + '/publish', {
      method: 'PUT', headers: { Authorization: 'Bearer ' + token }
    });
    var data = await res.json();
    if (data.success) loadGallery();
    else alert('Error: ' + data.message);
  } catch (err) { alert('Error: ' + err.message); }
}

// Delete photo
async function deletePhoto(id, title) {
  if (!confirm('Delete "' + title + '"? This cannot be undone.')) return;
  try {
    var res  = await fetch(API + '/gallery/' + id, {
      method: 'DELETE', headers: { Authorization: 'Bearer ' + token }
    });
    var data = await res.json();
    if (data.success) { if (editingId === id) resetForm(); loadGallery(); }
    else alert('Error: ' + data.message);
  } catch (err) { alert('Error: ' + err.message); }
}

// Reset form
function resetForm() {
  editingId = null;
  document.getElementById('formTitle').textContent = 'Upload Photo';
  document.getElementById('formSub').textContent   = 'Add a new photo to the gallery';
  document.getElementById('titleEN').value = '';
  document.getElementById('titleAM').value = '';
  document.getElementById('titleOR').value = '';
  document.getElementById('category').value = 'General';
  document.getElementById('isPublished').checked = true;
  var imgInput = document.getElementById('imageInput');
  if (imgInput) imgInput.value = '';
  var prev = document.getElementById('imgPreview');
  if (prev) prev.innerHTML = 'Click to select photo';
  var btn = document.querySelector('.save-btn');
  if (btn) btn.textContent = 'Upload Photo';
  var alertEl = document.getElementById('formAlert');
  if (alertEl) alertEl.style.display = 'none';
}

// Init
loadGallery();

// ============================================================
// MESOB Superadmin - Settings Page
// Dark/Light mode + Language + Public site defaults
// ============================================================

var token = localStorage.getItem('mesob_admin_token');
if (!token) window.location.href = 'login.html';

function logout() {
  localStorage.removeItem('mesob_admin_token');
  localStorage.removeItem('mesob_admin');
  window.location.href = 'login.html';
}

// THEME
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  var isDark = theme === 'dark';
  var toggle = document.getElementById('darkToggle');
  var thumb  = document.getElementById('toggleThumb');
  var label  = document.getElementById('themeLabel');
  if (toggle) toggle.checked = isDark;
  if (thumb)  thumb.textContent = isDark ? '🌙' : '☀️';
  if (label)  label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
}

function toggleTheme() {
  var cur   = document.documentElement.getAttribute('data-theme') || 'light';
  var next  = cur === 'light' ? 'dark' : 'light';
  localStorage.setItem('mesob_admin_theme', next);
  applyTheme(next);
  // Save public site theme default too
  var currentLang = localStorage.getItem('mesob_admin_lang') || 'en';
  saveSiteDefaults(next, currentLang);
  showNotice((next === 'dark' ? '🌙 Dark mode' : '☀️ Light mode') + ' enabled — public site updated');
}

// LANGUAGE — sets admin panel display language AND saves public site default
function setLanguage(lang) {
  localStorage.setItem('mesob_admin_lang', lang);
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  if (window.MESOB_PREFS && window.MESOB_PREFS.applyAll) {
    window.MESOB_PREFS.applyAll(lang);
  }
  // Save the public site default lang (same as admin choice on this page)
  var currentTheme = localStorage.getItem('mesob_admin_theme') || 'light';
  saveSiteDefaults(currentTheme, lang);
  var names = { en: 'English', am: 'Amharic', or: 'Afaan Oromo' };
  showNotice('Language set to ' + (names[lang] || lang) + ' - public site updated');
}

// Save public site defaults to DB (theme + default language for first-time visitors)
async function saveSiteDefaults(theme, lang) {
  try {
    var res  = await fetch(window.location.origin + '/api/content', {
      method:  'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_default_theme: theme, site_default_lang: lang })
    });
    var data = await res.json();
    if (data.success) updateDefaultDisplays(theme, lang);
  } catch(e) { /* silent */ }
}

// Update the Public Site Defaults preview cards
function updateDefaultDisplays(theme, lang) {
  var langNames  = { en: 'English', am: 'Amharic (Amharic)', or: 'Afaan Oromo' };
  var themeNames = { light: 'Light Mode', dark: 'Dark Mode' };
  var ld = document.getElementById('defaultLangDisplay');
  var td = document.getElementById('defaultThemeDisplay');
  if (ld) ld.textContent = langNames[lang]   || lang;
  if (td) td.textContent = themeNames[theme] || theme;
}

// Notice banner
function showNotice(msg) {
  var el = document.querySelector('.save-notice span:last-child');
  if (!el) return;
  var orig = el.getAttribute('data-orig') || el.textContent;
  el.setAttribute('data-orig', orig);
  el.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.textContent = orig; }, 2500);
}

// Init
window.addEventListener('DOMContentLoaded', function() {
  // Admin panel uses its OWN language preference (separate from public site default)
  var theme = localStorage.getItem('mesob_admin_theme') || 'light';
  var lang  = localStorage.getItem('mesob_admin_lang')  || 'en';
  applyTheme(theme);

  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Load public site defaults from DB — only update the preview display cards,
  // NOT the admin panel language/theme (those are admin-local preferences)
  fetch(window.location.origin + '/api/content')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success) return;
      var dbTheme = data.data.site_default_theme || 'light';
      var dbLang  = data.data.site_default_lang  || 'or';
      // Only update the preview cards — don't touch admin panel lang/theme
      updateDefaultDisplays(dbTheme, dbLang);
    })
    .catch(function() {});
});

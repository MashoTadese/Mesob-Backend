// ============================================================
// MESOB Superadmin - Services Admin
// Step 1: See all 11 windows as cards
// Step 2: Click a window to edit its titles and services
// ============================================================

var API   = window.location.origin + '/api';
var token = localStorage.getItem('mesob_admin_token');
if (!token) window.location.href = 'login.html';

function logout() {
  localStorage.removeItem('mesob_admin_token');
  localStorage.removeItem('mesob_admin');
  window.location.href = 'login.html';
}

function showAlert(msg, type) {
  var el = document.getElementById('globalAlert');
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert ' + type;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 4000);
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Window icons — emoji matching the public site icons
var WIN_ICONS = {
  1: '🪪', 2: '🤝', 3: '📨', 4: '🏗️', 5: '👤',
  6: '💼', 7: '📝', 8: '📈', 9: '🗺️', 10: '💰', 11: '⚙️'
};

// Default 11 windows — used as fallback when no DB data exists
// titleAM values are correct UTF-8 Ethiopic (Amharic) script
var DEFAULT_WINDOWS = [
  {
    id: 1, name: 'Fooddaa 1ffaa', nameEN: 'Window 1',
    title: "Kenna Ragaalee Bu'uuraa", titleEN: 'Basic Document Services', titleAM: 'መሠረታዊ ሰነዶች አገልግሎት',
    floor: 'Ground Floor',
    services: [
      'Waraqaa Eenyummaa Jirataa kennuu (Resident ID Issuance)',
      'Simannaa maamila haaraa fi Gurgurtaa Biilii Bishanii (New Customer Reception & Water Bill)',
      'Qaama seerummaa waldaalee IMX kennuu (IMX Association Legal Status)',
      'Hoji dhabdoota galmeessuu, kaardii hoji dhabdummaa kennuu (Job Seeker Registration & Card Issuance)',
      'Kaardii Hoji dhabdumma Haaromsuu (Job Seeker Card Renewal)'
    ]
  },
  {
    id: 2, name: 'Fooddaa 2ffaa', nameEN: 'Window 2',
    title: 'Deeggersa fi Xalayaalee', titleEN: 'Support Letters & Insurance', titleAM: 'ድጋፍ ደብዳቤዎች እና ኢንሹራንስ',
    services: [
      'Xalayaa deggarsaa daldaltootaaf kennuu (Support Letter for Traders - Market Linkage)',
      'Inshuraansii fayyaa hawaasaa kennuu (Community Health Insurance Issuance)',
      'Inshuraansii fayyaa hawaasaa haaromsuu (Community Health Insurance Renewal)',
      'Deeggersa waldaalee IMX paakeejiwwan deggersaa (IMX Association Support Packages)',
      "Waldaalee IMX Investimentiitti ce'aniif waraqaa ragaa kennuu (Certificate for IMX to Investment)",
      'Xalayaa deeggarsaa adda addaa kennuu (Various Support Letters)',
      'Xalayaa Deegarsa Barsiisoota fi Hoggantoota (Support Letter for Teachers & Managers)'
    ]
  },
  {
    id: 3, name: 'Fooddaa 3ffaa', nameEN: 'Window 3',
    title: 'Komii fi Iyyannoo', titleEN: 'Complaints & Petitions', titleAM: 'ቅሬታዎች እና ጥያቄዎች',
    services: [
      "Deegarsa Bu'uuraalee Misooma (Ibsaa, Daandii, Bishaanii) Kennuu (Infrastructure Support - Electricity, Road, Water)",
      'Komii adda addaa keessuumeessuu (Various Complaints Handling)',
      'Iyyannoo adda addaa keessuumeessuu (Various Petitions Handling)',
      'Komii hojjattoota mootummaa Keessumeessuu (Government Employees Complaints)',
      'Komii kaafamtoota Misoomaa Hiikuu (Development Displaced Persons Complaint Resolution)'
    ]
  },
  {
    id: 4, name: 'Fooddaa 4ffaa', nameEN: 'Window 4',
    title: 'Barnootaa fi Ijaarsa', titleEN: 'Education & Construction', titleAM: 'ትምህርት እና ግንባታ',
    services: [
      'Tajaajila jijjiirraa barsiisotaa/hooggantoota manneen barnootaa (Teacher/School Manager Transfer)',
      'Ragaa barnootaa sadarkaa naannoo (kutaa 6ffaa fi 8ffaa) bade kennuu (Lost Regional Certificate Grade 6 & 8)',
      'Hayyama Gahumsa Manneen Barnoota Dhuunfaa fi miti mootummaa Kennuu (Private/NGO School License)',
      'Hayyama suphaa mana mootummaa kennuu (Government House Repair Permit)',
      'Kaffaltii kiraa mana mootummaa fi dhuunfaa raawwachiisuu (Govt/Private House Rent Payment)',
      'Hayyama manneen yaalaa dhuunfaa kennuu (Private Clinic License Issuance)'
    ]
  },
  {
    id: 5, name: 'Fooddaa 5ffaa', nameEN: 'Window 5',
    title: 'Mirkaneessa Gahumsa Ogummaa', titleEN: 'Professional Competence', titleAM: 'የሙያ ብቃት ማረጋገጫ',
    services: [
      'Qindeessa Garee Galmee fi mirkaneessa Gahumsaa Industrii konistraakshinii (Construction Industry Competence Registration)',
      'Waraqaa qulqullinaa gahumsa ogummaa fayyaa kennuu (Health Professional Competence Certificate)',
      'Waraqaa qulqullinaa gahumsa ogummaa fayyaa haaromsuu (Health Professional Certificate Renewal)',
      'Waraqaa qulqullinaa gahumsa dhaabbilee daldalaa kennuu (Commercial Establishment Competence Certificate)',
      'Hayyama gahumsa ogummaa dhaabilee aadaa kennuu, haaromsuu, haquu (Cultural Institution Professional License)'
    ]
  },
  {
    id: 6, name: 'Fooddaa 6ffaa', nameEN: 'Window 6',
    title: 'Hayyama Daldalaa fi Geejiba', titleEN: 'Trade License & Transport', titleAM: 'የንግድ ፈቃድ እና ትራንስፖርት',
    services: [
      'Hayyama daldalaa kennuu, haaromsuu, fooyyessuu fi haquu (Trade License - New, Renewal, Amendment, Cancellation)',
      'Moggaasa maqaa daldalaa kennuu (Trade Name Registration)',
      'Hayyama konkolaachisaa haromsuu (Driving License Renewal)',
      'Hayyama konkolaachisaa kennuu (New Driving License)',
      'Hayyama Bobbii Konkoolaataa kennuu (Vehicle Deployment Permit)',
      'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu kennuu (Private Employment Agency License)',
      'Waldiddaa dhimma hojjataaf hojjachiisaa jidduu jiru keessuumeessuu (Labour Dispute Handling)'
    ]
  },
  {
    id: 7, name: 'Fooddaa 7ffaa', nameEN: 'Window 7',
    title: 'Sanadoota Sivilii fi Waliigaltee', titleEN: 'Civil Documents & Agreements', titleAM: 'የሲቪል ሰነዶች እና ስምምነቶች',
    services: [
      "Waldaalee lafa mana jireenyaa Gurmaa'aniif qaama seerummaa kennuu fi haquu (Housing Cooperative Legal Status)",
      'Galmeessaa Sanadoota Sivilii (Civil Document Registration Service)',
      'Mirkaneessa Sadadoota Sivilii (Civil Document Authentication Service)',
      'Barreefama hundeefamaa daldala dhuunfaa PLC (Private Limited Company Establishment)',
      'Galmeesssa Waldaalee IMX SME (Small and Micro Enterprise Registration)',
      'Galmeessa waliigaltee Liqii (Loan Agreement Registration)',
      'Bakka bu\'ummaa galmeessuuu fi kennuu (Special Power of Agency)'
    ]
  },
  {
    id: 8, name: 'Fooddaa 8ffaa', nameEN: 'Window 8',
    title: 'Tajaajila Invastimantii', titleEN: 'Investment Services', titleAM: 'የኢንቨስትመንት አገልግሎቶች',
    services: [
      'Simannaa Piroojektoota invastimantii (Investment Project Reception)',
      'Hayyama invastimantii kennuu (Haaraa, Haaromsu, Bakka Buusuu) (Investment License - New, Renewal, Replacement)',
      'Tajaajila Hayyama Jajjabeessituu Invastimantii Kennuu (Investment Incentive License)',
      "Piroojektii investimantii Babal'insa / Expansion (Investment Project Expansion)",
      'Mirkaneessa Qorannoo haalaa dhiibbaa Naannoo (Environmental Impact Assessment)',
      'TOR Qorannoo Eegumsa Nannoo Mirkaneessuu (Environmental Protection TOR Approval)'
    ]
  },
  {
    id: 9, name: 'Fooddaa 9ffaa', nameEN: 'Window 9',
    title: 'Tajaajila Lafaa fi Qabiyyee', titleEN: 'Land & Property Services', titleAM: 'የመሬት እና ንብረት አገልግሎቶች',
    services: [
      'Komii Waldiddaa Lafaa Simachuu fi Hiikuu (Land Dispute Complaint Resolution)',
      'Galmeessaa fi Kenna Kaartaa qabbiyyee (Land Holding Card Registration & Issuance)',
      'Jijjiirraa maqaa raawwachuu (Bittaa fi Gurgurtaa, Kenna, Dhaaltummaa) (Name Transfer)',
      'Walii galtee Liizii Galmeessuu (Lease Agreement Registration)',
      'Walii galtee Liizii Haaromsuu (Lease Agreement Renewal)',
      'Tilmaama Qabiyyee Raawwachuu (Property Valuation)',
      'Galmeessaa fi Kenna Kaartaa Dijitaalaa (Digital Card Registration & Issuance)',
      'Sanada bade bakka buusuu fi seera qabeessumma qabiyyee mirkaneessuu (Lost Document Replacement)'
    ]
  },
  {
    id: 10, name: 'Fooddaa 10ffaa', nameEN: 'Window 10',
    title: 'Sassabbii Galii fi Gibiraa', titleEN: 'Revenue & Tax Collection', titleAM: 'ገቢ እና ታክስ ስብስብ',
    services: [
      'Lakkoofsa kaffalaa Gibiraa - TIN (Tax Identification Number)',
      'Sassabbii galii Idilee (Regular Revenue Collection)',
      'Murtii Gibiraa, kaffaltii VAT, TOT fi withholding galmeessuu (Tax Assessment - VAT, TOT, Withholding)',
      "Waraqaa qulqullina idaa irraa bilisa ta'u ibsu (Debt Clearance Certificate)",
      'Gabaasa ooditii (Audit Report)',
      'Sassaabii galii geejjibaa raawwachuu (Transport Revenue Collection)',
      'Galii Bishaan dhugaatii (Drinking Water Revenue)'
    ]
  },
  {
    id: 11, name: 'Fooddaa 11ffaa', nameEN: 'Window 11',
    title: 'Kanfaltii fi Tajaajila Addaa', titleEN: 'Payment & Special Services', titleAM: 'ክፍያ እና ልዩ አገልግሎቶች',
    services: [
      'Ogeessa Kanfaltii beenyaa (nama 2) - Compensation Payment Expert x2',
      'Ogeessa kanfaltii projeektii (nama 2) - Project Payment Expert x2',
      'Ogeessa liqii kafaamtoota misoomaa (nama 1) - Development Displaced Persons Loan Expert x1',
      'Ogeessa Kanfaltii tajaajila addaa addaa (nama 2) - Various Service Payment Expert x2',
      'Ogeessa bittaa fi tajaajilaa (nama 2) - Procurement & Service Expert x2'
    ]
  }
];

var windows     = [];
var activeIndex = -1;

// Load windows from DB, fall back to defaults
async function loadWindows() {
  try {
    var res  = await fetch(API + '/services');
    var data = await res.json();
    if (data.success && data.data && data.data.length) {
      // Map DB documents back to the shape the UI expects (windowId → id)
      windows = data.data.map(function(w) {
        return {
          id:         w.windowId,
          name:       w.name,
          nameEN:     w.nameEN,
          title:      w.title,
          titleEN:    w.titleEN,
          titleAM:    w.titleAM,
          floor:      w.floor || 'Ground Floor',
          services:   w.services   || [],
          servicesEN: w.servicesEN || [],
          servicesAM: w.servicesAM || [],
        };
      });
      updateDbStatus(true, windows.length);
    } else {
      windows = JSON.parse(JSON.stringify(DEFAULT_WINDOWS));
      updateDbStatus(false, 0);
    }
  } catch(e) {
    windows = JSON.parse(JSON.stringify(DEFAULT_WINDOWS));
    updateDbStatus(false, 0);
  }
  renderWindowsGrid();
}

// Show whether data is from DB or static file
function updateDbStatus(fromDb, count) {
  var el = document.getElementById('dbStatus');
  if (!el) return;
  if (fromDb) {
    el.textContent = '✅ Data loaded from database (' + count + ' windows). Changes save live to the public site.';
    el.style.color = '#059669';
  } else {
    el.textContent = '⚠️ No database data yet — showing static defaults. Click "Save All to Database" to persist the data.';
    el.style.color = '#d97706';
  }
}

// Seed all 11 windows to database in one click
async function seedToDatabase() {
  var btn = document.getElementById('seedBtn');
  if (!confirm('Save all ' + windows.length + ' service windows to the database?')) return;
  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }
  try {
    var res = await fetch(API + '/services/seed', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ windows: windows })
    });
    var data = await res.json();
    if (data.success) {
      showAlert('✅ All ' + data.count + ' windows saved to database!', 'success');
      updateDbStatus(true, data.count);
    } else {
      showAlert(data.message || 'Failed', 'error');
    }
  } catch(err) {
    showAlert('Error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.textContent = '💾 Save All to Database'; btn.disabled = false; }
  }
}

// Render window cards grid
function renderWindowsGrid() {
  var grid = document.getElementById('windowsGrid');
  if (!grid) return;
  if (!windows.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#9ca3af;font-size:14px">No windows yet. Click "+ New Window" to add one.</div>';
    return;
  }
  grid.innerHTML = windows.map(function(w, i) {
    var icon      = WIN_ICONS[w.id] || '🏛️';
    var floorBadge = w.floor || 'Ground Floor';
    return '<div class="win-card" onclick="openEditor(' + i + ')">'
      + '<button class="wc-edit" onclick="event.stopPropagation();openEditor(' + i + ')">Edit</button>'
      + '<div class="wc-icon">' + icon + '</div>'
      + '<div class="wc-num">' + escHtml(w.nameEN || 'Window ' + w.id) + '</div>'
      + '<div class="wc-name">' + escHtml(w.name || '') + '</div>'
      + '<div class="wc-title">' + escHtml(w.titleEN || '') + '</div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">'
      +   '<div class="wc-count">' + (w.services ? w.services.length : 0) + ' services</div>'
      +   '<span style="font-size:10px;font-weight:700;color:#1e3578;background:#f0f4ff;padding:2px 8px;border-radius:20px">🏢 ' + escHtml(floorBadge) + '</span>'
      + '</div>'
      + '</div>';
  }).join('');
}

// Current language tab for services editor
var activeSvcLang = 'or';

function switchSvcLang(lang) {
  activeSvcLang = lang;
  document.querySelectorAll('.svc-lang-btn').forEach(function(btn) {
    var isActive = btn.getAttribute('data-svclang') === lang;
    btn.style.background = isActive ? '#0f1f5c' : '#f3f4f6';
    btn.style.color      = isActive ? '#fff' : '#374151';
  });
  document.getElementById('svcPanel-or').style.display = lang === 'or' ? 'block' : 'none';
  document.getElementById('svcPanel-en').style.display = lang === 'en' ? 'block' : 'none';
  document.getElementById('svcPanel-am').style.display = lang === 'am' ? 'block' : 'none';

  var placeholder = lang === 'am'
    ? 'Tajaajila Afaan Amaaraa...'
    : lang === 'en'
    ? 'e.g. Resident ID Issuance...'
    : 'e.g. Waraqaa Eenyummaa Jirataa kennuu (Resident ID Issuance)';
  document.getElementById('newServiceInput').placeholder = placeholder;
}

// Open editor for a window — pass -1 for new window
function openEditor(index) {
  activeIndex = index;
  activeSvcLang = 'or'; // always start on Oromo tab
  var isNew = (index === -1);
  var w = isNew ? { id: null, name: '', nameEN: '', title: '', titleEN: '', titleAM: '', floor: 'Ground Floor', services: [], servicesEN: [], servicesAM: [] } : windows[index];

  document.getElementById('breadcrumbText').textContent  = isNew ? 'New Window' : ((w.nameEN || 'Window ' + w.id) + ' — ' + (w.titleEN || ''));
  document.getElementById('editorIcon').textContent      = isNew ? '🆕' : (WIN_ICONS[w.id] || '🏛️');
  document.getElementById('editorHeadTitle').textContent = isNew ? 'Add New Service Window' : ((w.nameEN || '') + ': ' + (w.titleEN || ''));
  document.getElementById('editorHeadSub').textContent   = isNew ? 'Fill in the details and choose the floor' : 'Edit window titles, services (in all 3 languages)';

  document.getElementById('winNameOR').value  = w.name    || '';
  document.getElementById('winNameEN').value  = w.nameEN  || '';
  document.getElementById('winTitleOR').value = w.title   || '';
  document.getElementById('winTitleEN').value = w.titleEN || '';
  document.getElementById('winTitleAM').value = w.titleAM || '';
  document.getElementById('winFloor').value   = w.floor   || 'Ground Floor';
  document.getElementById('newServiceInput').value = '';

  // Reset to OR tab
  switchSvcLang('or');

  var delBtn = document.getElementById('deleteWinBtn');
  if (delBtn) delBtn.style.display = isNew ? 'none' : 'inline-flex';

  renderServicesForLang('or', w.services  || []);
  renderServicesForLang('en', w.servicesEN || []);
  renderServicesForLang('am', w.servicesAM || []);

  document.getElementById('windowsView').style.display = 'none';
  document.getElementById('editorView').style.display  = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render services list for a specific language
function renderServicesForLang(lang, list) {
  var listId = lang === 'or' ? 'servicesList' : (lang === 'en' ? 'servicesListEN' : 'servicesListAM');
  var container = document.getElementById(listId);
  if (!container) return;

  if (lang === 'or') {
    var count = document.getElementById('svcCount');
    if (count) count.textContent = list.length + (list.length === 1 ? ' service' : ' services');
  }

  if (!list.length) {
    container.innerHTML = '<div class="empty-services">No ' + (lang === 'or' ? 'Oromo' : lang === 'en' ? 'English' : 'Amharic') + ' services yet.</div>';
    return;
  }
  container.innerHTML = list.map(function(s, i) {
    return '<div class="service-row">'
      + '<span class="svc-num">' + (i + 1) + '</span>'
      + '<span class="svc-text">' + escHtml(s) + '</span>'
      + '<button type="button" class="svc-del" onclick="removeServiceLang(\'' + lang + '\', ' + i + ')">Remove</button>'
      + '</div>';
  }).join('');
}

// Go back to grid
function showWindowsView() {
  activeIndex = -1;
  document.getElementById('editorView').style.display  = 'none';
  document.getElementById('windowsView').style.display = 'block';
  renderWindowsGrid();
}

// Add service to the active language list
function addService() {
  var input = document.getElementById('newServiceInput');
  var val   = input.value.trim();
  if (!val) { input.focus(); return; }
  if (activeIndex === -1) {
    showAlert('Save window basics first before adding services.', 'error');
    return;
  }
  var w = windows[activeIndex];
  var lang = activeSvcLang;
  if (lang === 'or') {
    if (!w.services) w.services = [];
    w.services.push(val);
    renderServicesForLang('or', w.services);
  } else if (lang === 'en') {
    if (!w.servicesEN) w.servicesEN = [];
    w.servicesEN.push(val);
    renderServicesForLang('en', w.servicesEN);
  } else {
    if (!w.servicesAM) w.servicesAM = [];
    w.servicesAM.push(val);
    renderServicesForLang('am', w.servicesAM);
  }
  input.value = '';
  input.focus();
}

// Remove service from a specific language list
function removeServiceLang(lang, index) {
  var w = windows[activeIndex];
  if (lang === 'or') {
    w.services.splice(index, 1);
    renderServicesForLang('or', w.services);
  } else if (lang === 'en') {
    if (w.servicesEN) w.servicesEN.splice(index, 1);
    renderServicesForLang('en', w.servicesEN || []);
  } else {
    if (w.servicesAM) w.servicesAM.splice(index, 1);
    renderServicesForLang('am', w.servicesAM || []);
  }
}

// Save window to DB — POST for new, PUT for existing
document.getElementById('winForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = this.querySelector('[type="submit"]');
  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }

  var isNew   = (activeIndex === -1);
  var payload = {
    name:       document.getElementById('winNameOR').value.trim(),
    nameEN:     document.getElementById('winNameEN').value.trim(),
    title:      document.getElementById('winTitleOR').value.trim(),
    titleEN:    document.getElementById('winTitleEN').value.trim(),
    titleAM:    document.getElementById('winTitleAM').value.trim(),
    floor:      document.getElementById('winFloor').value,
    services:   isNew ? [] : (windows[activeIndex].services   || []),
    servicesEN: isNew ? [] : (windows[activeIndex].servicesEN || []),
    servicesAM: isNew ? [] : (windows[activeIndex].servicesAM || []),
  };

  if (!payload.name || !payload.nameEN) {
    showAlert('Window Name fields are required.', 'error');
    if (btn) { btn.textContent = '💾 Save Window'; btn.disabled = false; }
    return;
  }

  // If editing, use the in-memory services (already modified by add/remove)
  if (!isNew) {
    payload.services = windows[activeIndex].services;
  }

  try {
    var url    = isNew ? API + '/services' : API + '/services/' + windows[activeIndex].id;
    var method = isNew ? 'POST' : 'PUT';
    var res    = await fetch(url, {
      method:  method,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    if (res.status === 401) { showAlert('Session expired. Please log in again.', 'error'); setTimeout(function(){ window.location.href='login.html'; }, 1500); return; }
    var data = await res.json();
    if (data.success) {
      showAlert((isNew ? '✅ New window created on ' : '✅ ') + payload.floor + (isNew ? '!' : ' — ' + payload.nameEN + ' saved!'), 'success');
      await loadWindows(); // reload from DB
      setTimeout(function() { showWindowsView(); }, 1200);
    } else {
      showAlert(data.message || 'Failed to save', 'error');
    }
  } catch(err) {
    showAlert('Error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.textContent = '💾 Save Window'; btn.disabled = false; }
  }
});

// Delete current window from DB
async function deleteCurrentWindow() {
  if (activeIndex === -1) return;
  var w = windows[activeIndex];
  if (!confirm('Delete "' + escHtml(w.nameEN || w.name) + '"? This will remove it from the public site permanently.')) return;
  try {
    var res  = await fetch(API + '/services/' + w.id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    var data = await res.json();
    if (data.success) {
      showAlert('Window deleted successfully.', 'success');
      await loadWindows();
      showWindowsView();
    } else {
      showAlert(data.message || 'Delete failed', 'error');
    }
  } catch(err) {
    showAlert('Error: ' + err.message, 'error');
  }
}

// Enter key in service input adds service
document.getElementById('newServiceInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') { e.preventDefault(); addService(); }
});

// Init
loadWindows();

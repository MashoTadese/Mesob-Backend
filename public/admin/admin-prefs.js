// ============================================================
// MESOB Admin — Global Preferences
// Dark/Light mode  Full page language translation
// Runs on EVERY admin page via <script src="admin-prefs.js">
// ============================================================

(function () {

  // ── Step 1: Inject dark CSS + apply theme IMMEDIATELY ────
  // (prevents flash of wrong theme)
  var _link = document.createElement('link');
  _link.rel = 'stylesheet';
  _link.href = 'admin-dark.css';
  document.head.appendChild(_link);

  var _theme = localStorage.getItem('mesob_admin_theme') || 'light';
  document.documentElement.setAttribute('data-theme', _theme);
  document.documentElement.style.transition = 'background .3s, color .3s';

  // ── Step 2: Full translations dictionary ─────────────────
  var DICT = {

    // ── NAV links ──────────────────────────────
    'nav.dashboard':   { en:'Dashboard',       am:'ዳሽቦርድ',              or:"Daashboordii" },
    'nav.about':       { en:'About Us',         am:'ስለ እኛ',              or:"Waa'ee Keenya" },
    'nav.services':    { en:'Services',         am:'አገልግሎቶች',           or:'Tajaajilaalee' },
    'nav.requirements':{ en:'Requirements',     am:'መስፈርቶች',             or:'Wabii Tajaajilaa' },
    'nav.complaints':  { en:'Complaints',       am:'ቅሬታዎች',             or:'Komii' },
    'nav.faq':         { en:'FAQ',               am:'ተደጋጋሚ ጥያቄዎች',       or:'Gaafilee Deddeebii' },
    'nav.messages':    { en:'Messages',          am:'መልዕክቶች',             or:'Ergaalee' },
    'nav.contact':     { en:'Contact Us',        am:'አድራሻ',               or:'Qunnamtii' },
    'nav.profile':     { en:'Profile',           am:'መገለጫ',               or:'Eenyummaa' },
    'nav.settings':    { en:'Settings',          am:'ቅንብሮች',             or:"Qindaa'ina" },
    'nav.analytics':   { en:'Analytics',         am:'ትንታኔ',               or:'Xiinxala' },
    'nav.news':        { en:'News',               am:'ዜናዎች',               or:'Oduu' },
    'nav.gallery':     { en:'Gallery',            am:'ጋለሪ',                or:'Galarii' },

    // ── Common actions ─────────────────────────
    'btn.signout':     { en:'Sign Out',            am:'ውጣ',                    or:"Ba'i" },
    'btn.save':        { en:'Save Changes',        am:'ለውጦችን አስቀምጥ',          or:'Jijjiirama Kuusi' },
    'btn.delete':      { en:'Delete',              am:'ሰርዝ',                   or:'Haqi' },
    'btn.close':       { en:'Close',               am:'ዝጋ',                    or:'Cufii' },
    'btn.cancel':      { en:'Cancel',              am:'ሰርዝ',                   or:'Dhiisi' },
    'btn.reply':       { en:'Reply',             am:'መልስ ስጥ',             or:'Deebii Kenni' },
    'btn.viewAll':     { en:'View All →',          am:'ሁሉንም ይመልከቱ →',         or:'Hundumaa ilaali →' },
    'btn.view':        { en:'View',                am:'ይመልከቱ',                 or:'Ilaali' },
    'btn.send':        { en:'Send Reply',          am:'መልስ ላክ',                or:'Deebii Ergi' },
    'btn.addFaq':      { en:'Add FAQ',           am:'ጥያቄ ጨምር',            or:'Gaafii Dabaluu' },
    'btn.saveContact': { en:'Save Contact Info', am:'አድራሻ አስቀምጥ',         or:'Qunnamtii Kuusi' },

    // ── Dashboard ──────────────────────────────
    'dash.title':        { en:'Dashboard Overview',      am:'ዳሽቦርድ አጠቃላይ',        or:'Daashboordii Guutuu' },
    'dash.recentComp':   { en:'Recent Complaints',    am:'የቅርብ ጊዜ ቅሬታዎች',  or:'Komii Dhiyeenya' },
    'dash.recentMsg':    { en:'Recent Messages',       am:'የቅርብ ጊዜ መልዕክቶች', or:'Ergaalee Dhiyeenya' },
    'dash.loading':      { en:'Loading statistics...',   am:'ስታቲስቲክስ በመጫን...',   or:'Lakkoofsa fe\'amaa jira...' },
    'dash.totalComp':    { en:'Total Complaints',        am:'ጠቅላላ ቅሬታዎች',         or:'Komii Waliigala' },
    'dash.pending':      { en:'Pending Review',          am:'በጥበቃ ላይ',             or:'Eegamaa' },
    'dash.resolved':     { en:'Resolved',                am:'ተፈቷል',                or:'Furmaata Argate' },
    'dash.messages':     { en:'Messages',                am:'መልዕክቶች',              or:'Ergaalee' },
    'dash.unread':       { en:'Unread',                  am:'ያልተነበበ',              or:'Hin Dubbifamne' },
    'dash.newsPosts':    { en:'News Posts',              am:'ዜናዎች',                or:'Oduu' },

    // ── Complaints page ────────────────────────
    'comp.title':        { en:'Complaints Management',am:'ቅሬታዎች አስተዳደር',   or:'Komii Bulchiinsa' },
    'comp.searchPH':     { en:'Search by name or ref #...', am:'በስም ወይም ቁጥር ፈልግ...', or:'Maqaa ykn lak. barbaadi...' },
    'comp.allStatus':    { en:'All Status',              am:'ሁሉም ሁኔታ',            or:'Haala Hundumaa' },
    'comp.allTypes':     { en:'All Types',               am:'ሁሉም ዓይነቶች',          or:'Gosa Hundumaa' },
    'comp.thRef':        { en:'Ref #',                   am:'ቁጥር',                 or:'Lak.' },
    'comp.thName':       { en:'Name',                    am:'ስም',                  or:'Maqaa' },
    'comp.thDept':       { en:'Department',              am:'ዲፓርትመንት',             or:'Damee' },
    'comp.thType':       { en:'Type',                    am:'ዓይነት',                or:'Gosa' },
    'comp.thStatus':     { en:'Status',                  am:'ሁኔታ',                 or:'Haala' },
    'comp.thDate':       { en:'Date',                    am:'ቀን',                  or:'Guyyaa' },
    'comp.thAction':     { en:'Action',                  am:'እርምጃ',                or:'Tarkaanfii' },
    'comp.details':      { en:'Complaint Details',       am:'የቅሬታ ዝርዝሮች',         or:'Komii Bal\'inaan' },
    'comp.updateStatus': { en:'Update Status',           am:'ሁኔታ አዘምን',            or:'Haala Haaromsi' },
    'comp.response':     { en:'Response to Complainant (Optional)', am:'ለቅሬታ ሰጭ ምላሽ (አማራጭ)', or:'Deebii Komii (Filannoo)' },
    'comp.responsePH':   { en:'Write your response...',  am:'ምላሽህን ጻፍ...',         or:'Deebii kee barreessi...' },

    // ── Messages page ──────────────────────────
    'msg.title':        { en:'Messages & Complaints',  am:'መልዕክቶች እና ቅሬታዎች', or:'Ergaalee fi Komii' },
    'msg.subtitle':     { en:'All customer communications in one place', am:'ሁሉም የደንበኛ መልዕክቶች', or:'Quunnamtii maamilaa hundumaa' },
    'msg.tabAll':       { en:'All',                       am:'ሁሉም',                or:'Hundumaa' },
    'msg.tabContact':   { en:'Contact Us',                am:'አድራሻ',               or:'Qunnamtii' },
    'msg.tabComp':      { en:'Complaints',                am:'ቅሬታዎች',              or:'Komii' },
    'msg.thSource':     { en:'Source',                    am:'ምንጭ',                or:'Madda' },
    'msg.thCustomer':   { en:'Customer',                  am:'ደንበኛ',               or:'Maamilaa' },
    'msg.thSubject':    { en:'Subject / Type',            am:'ርዕስ / ዓይነት',         or:'Mata Duree / Gosa' },
    'msg.thStatus':     { en:'Status',                    am:'ሁኔታ',                or:'Haala' },
    'msg.thReply':      { en:'Reply',                     am:'ምላሽ',                or:'Deebii' },
    'msg.thDate':       { en:'Date',                      am:'ቀን',                 or:'Guyyaa' },
    'msg.statTotal':    { en:'Total',                     am:'ጠቅላላ',               or:'Waliigala' },
    'msg.statContact':  { en:'Contact Us',                am:'አድራሻ',               or:'Qunnamtii' },
    'msg.statComp':     { en:'Complaints',                am:'ቅሬታዎች',              or:'Komii' },

    // ── About page ─────────────────────────────
    'about.title':      { en:'About Us Management',   am:'ስለ እኛ አስተዳደር',    or:"Waa'ee Keenya Bulchiinsa" },
    'about.card1':      { en:'About Section Content',    am:'ስለ እኛ ይዘት',          or:"Waa'ee Keenya Qabiyyee" },
    'about.para1':      { en:'Paragraph 1 — Who we are', am:'አንቀጽ 1 — እነማን ነን',   or:'Kutaa 1 — Eenyuu Taanee' },
    'about.para2':      { en:'Paragraph 2 — What we do', am:'አንቀጽ 2 — ምን እናደርጋለን', or:'Kutaa 2 — Maalii Goona' },
    'about.para3':      { en:'Paragraph 3 — Branch info', am:'አንቀጽ 3 — የቅርንጫፍ መረጃ', or:'Kutaa 3 — Odeeffannoo Damee' },
    'about.card2':      { en:'Branch Highlights',        am:'ዋና ነጥቦች',             or:'Firii Mul\'ataa' },

    // ── FAQ page ───────────────────────────────
    'faq.title':        { en:'FAQ Management',         am:'ተደጋጋሚ ጥያቄዎች',     or:'Gaafilee Deddeebii' },
    'faq.addCard':      { en:'Add New FAQ',            am:'አዲስ ጥያቄ ጨምር',      or:'Gaafii Haaraa Dabaluu' },
    'faq.question':     { en:'Question *',               am:'ጥያቄ *',               or:'Gaafii *' },
    'faq.questionPH':   { en:'e.g. What documents do I need?', am:'ለምሳሌ ምን ሰነዶች ያስፈልጉኛል?', or:'Fkn. Sanadoota kamtu natti barbaachisu?' },
    'faq.answer':       { en:'Answer *',                 am:'መልስ *',               or:'Deebii *' },
    'faq.listCard':     { en:'Existing FAQs',         am:'ያሉ ጥያቄዎች',         or:'Gaafilee Jiran' },

    // ── Contact Admin page ─────────────────────
    'cont.title':       { en:'Contact Info Management', am:'አድራሻ አስተዳደር',     or:'Qunnamtii Bulchiinsa' },
    'cont.editCard':    { en:'Edit Contact Information',   am:'አድራሻ ዝርዝሮችን አርትዕ', or:'Odeeffannoo Qunnamtii Gulaali' },
    'cont.note':        { en:'This information is displayed on the Contact Us section of the public website.', am:'ይህ መረጃ በህዝብ ድህረ ገጹ ላይ ይታያል።', or:'Odeeffannoon kun marsariitii ummataa irra mul\'ata.' },
    'cont.previewCard': { en:'Live Preview',           am:'ቀጥታ ቅድሚያ እይታ',   or:'Mul\'ata Qe\'ee' },

    // ── Profile page ───────────────────────────
    'prof.title':       { en:'My Profile',            am:'የኔ መገለጫ',           or:'Eenyummaa Koo' },
    'prof.picCard':     { en:'Profile Picture',          am:'የመገለጫ ስእል',            or:'Suuraa Eenyummaa' },
    'prof.editCard':    { en:'Edit Profile Information', am:'የመገለጫ ዝርዝሮችን አርትዕ',   or:'Odeeffannoo Eenyummaa Gulaali' },
    'prof.passCard':    { en:'Change Password',          am:'የቃለ ሚስጥር ቀይር',        or:'Jecha Darbii Jijjiiri' },
    'prof.changePhoto': { en:'Change Photo',          am:'ፎቶ ቀይር',           or:'Suuraa Jijjiiri' },
    'prof.fullName':    { en:'Full Name *',              am:'ሙሉ ስም *',              or:'Maqaa Guutuu *' },
    'prof.email':       { en:'Email Address',            am:'ኢሜይል አድራሻ',           or:'Teessoo Imeelii' },
    'prof.phone':       { en:'Phone Number',             am:'ስልክ ቁጥር',             or:'Lakkoofsa Bilbilaa' },
    'prof.position':    { en:'Position / Title',         am:'ደረጃ / ማዕረግ',          or:'Sadarkaa / Moggaasa' },
    'prof.currentPass': { en:'Current Password *',       am:'ያሁኑ የቃለ ሚስጥር *',      or:'Jecha Darbii Ammaa *' },
    'prof.newPass':     { en:'New Password *',           am:'አዲስ የቃለ ሚስጥር *',      or:'Jecha Darbii Haaraa *' },
    'prof.confirmPass': { en:'Confirm New Password *',   am:'አዲስ የቃለ ሚስጥር አረጋግጥ *', or:'Jecha Darbii Haaraa Mirkaneessi *' },
    'prof.saveBtn':     { en:'Save Changes',             am:'ለውጦችን አስቀምጥ',         or:'Jijjiirama Kuusi' },
    'prof.changePassBtn':{ en:'Change Password',         am:'የቃለ ሚስጥር ቀይር',        or:'Jecha Darbii Jijjiiri' },

    // ── Analytics page ─────────────────────────
    'anal.title':       { en:'Complaint Analytics',   am:'የቅሬታ ትንታኔ',        or:'Komii Xiinxala' },
    'anal.total':       { en:'Total Complaints',         am:'ጠቅላላ ቅሬታዎች',          or:'Komii Waliigala' },
    'anal.pending':     { en:'Pending',                  am:'በጥበቃ ላይ',              or:'Eegamaa' },
    'anal.resolved':    { en:'Resolved',                 am:'ተፈቷል',                 or:'Furmaata Argate' },
    'anal.underReview': { en:'Under Review',             am:'በገምገማ ላይ',             or:'Sakatta\'amaa' },
    'anal.byType':      { en:'By Complaint Type',        am:'በቅሬታ ዓይነት',            or:'Gosa Komii' },
    'anal.byStatus':    { en:'By Status',                am:'በሁኔታ',                 or:'Haala' },
    'anal.monthly':     { en:'Monthly Trend (Last 6 Months)', am:'ወርሃዊ አዝማሚያ',    or:'Cuqoo Ji\'a 6 Darbee' },
    'anal.byDept':      { en:'By Department / Window',   am:'በዲፓርትመንት / መስኮት',     or:'Damee / Foddaa' },

    // ── Settings page ──────────────────────────
    'sett.publicTitle':  { en:'Public Website Defaults',  am:'የህዝብ ድህረ ገጽ ነባሪዎች',   or:'Durtii Marsariitii Ummataa' },
    'sett.publicDesc':   { en:'Default for new visitors',    am:'ለአዲስ ጎብኚዎች ነባሪ',         or:'Durtii daawwattootaa haaraa' },
    'sett.publicSub':    { en:'First-time visitors will see these settings automatically', am:'ለመጀመሪያ ጊዜ ጎብኚዎች እነዚህ ቅንብሮችን ያያሉ', or:'Daawwattootni haaraan kana ni argatu' },
    'sett.title':       { en:'Settings',              am:'ቅንብሮች',             or:"Qindaa'ina" },
    'sett.subtitle':    { en:'Appearance and language preferences', am:'ገጽታ እና ቋንቋ ምርጫዎች', or:"Mul'ata fi Afaan Filanno" },
    'sett.prefs':       { en:'Preferences',              am:'ምርጫዎች',               or:'Filannoolee' },
    'sett.appearance':  { en:'Appearance',            am:'ገጽታ',               or:'Mul\'ata' },
    'sett.darkMode':    { en:'Dark Mode',                am:'ጨለማ ሁነታ',             or:'Haala Gara Duubaa' },
    'sett.darkSub':     { en:'Switch between light and dark theme', am:'ብርሃን እና ጨለማ ሁነታ መካከል ቀይር', or:'Haala iftuu fi gara duubaa jijjiiri' },
    'sett.langTitle':   { en:'Language',              am:'ቋንቋ',               or:'Afaan' },
    'sett.langLabel':   { en:'Admin Panel Language',     am:'የአስተዳዳሪ ፓነል ቋንቋ',     or:'Afaan Paanelii Hogganaa' },
    'sett.langSub':     { en:'Choose the display language for the admin interface', am:'ለአስተዳዳሪ ኢንተርፌስ የማሳያ ቋንቋ ምረጥ', or:'Afaan mul\'ata paanelii hogganaa filadhu' },
    'sett.notice':      { en:'Preferences are saved automatically in your browser and restored each time you log in.', am:'ምርጫዎች በአሳሽዎ ውስጥ ራስ-ሰር ይቀመጣሉ።', or:"Filannooleen browser keessan keessatti ofumaan kuufamu." },

    // ── Services page ──────────────────────────
    'serv.title':       { en:'Service Windows',       am:'አገልግሎት መስኮቶች',     or:'Foddaalee Tajaajilaa' },
    'serv.subtitle':    { en:'Click a window to edit its services', am:'አገልግሎቶቹን ለማርትዕ መስኮቱን ጠቅ አድርግ', or:'Tajaajila gulaluuf foddaa cuqaasi' },
    'serv.introText':   { en:'11 Service Windows — Click any window card to edit', am:'11 አገልግሎት መስኮቶች — ማርትዕ ለመጀመር ማንኛውንም ካርድ ጠቅ አድርግ', or:'Foddaalee Tajaajilaa 11 — Gulaluuf kaardii cuqaasi' },
    'serv.allWindows':  { en:'← All Windows',            am:'← ሁሉም መስኮቶች',          or:'← Foddaalee Hundumaa' },
    'serv.saveWindow':  { en:'Save Window',            am:'መስኮት አስቀምጥ',         or:'Foddaa Kuusi' },
  };

  // ── Step 3: Map nav href → translation key ────────────────
  var NAV_MAP = {
    'news-admin.html':     'nav.news',
    'gallery-admin.html':  'nav.gallery',
    'dashboard.html':     'nav.dashboard',
    'about.html':         'nav.about',
    'services-admin.html':'nav.services',
    'requirements-admin.html': 'nav.requirements',
    'complaints.html':    'nav.complaints',
    'faq-admin.html':     'nav.faq',
    'messages.html':      'nav.messages',
    'contact-admin.html': 'nav.contact',
    'profile.html':       'nav.profile',
    'settings.html':      'nav.settings',
    'analytics.html':     'nav.analytics',
  };

  // ── Step 4: Apply translation to entire page ──────────────
  function applyAll(lang) {
    var L = lang || 'en';

    function t(key) {
      return (DICT[key] && DICT[key][L]) || (DICT[key] && DICT[key]['en']) || key;
    }

    // Translate all elements with [data-i18n] attribute
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var target = el.getAttribute('data-i18n-attr');
      if (target === 'placeholder') {
        el.placeholder = t(key);
      } else {
        el.textContent = t(key);
      }
    });

    // Translate nav links
    document.querySelectorAll('nav a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop();
      var key  = NAV_MAP[href];
      if (key) a.textContent = t(key);
    });

    // Translate logout / signout buttons
    document.querySelectorAll('.logout-btn, .signout-btn').forEach(function (btn) {
      btn.textContent = t('btn.signout');
    });
  }

  // ── Step 5: Run when DOM is ready ────────────────────────
  function run() {
    var lang = localStorage.getItem('mesob_admin_lang') || 'en';
    applyAll(lang);

    // Highlight active lang button on settings page
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Sync dark toggle state if on settings page
    var toggle = document.getElementById('darkToggle');
    var thumb  = document.getElementById('toggleThumb');
    var label  = document.getElementById('themeLabel');
    var theme  = localStorage.getItem('mesob_admin_theme') || 'light';
    if (toggle) toggle.checked = (theme === 'dark');
    if (thumb)  thumb.textContent = (theme === 'dark') ? '' : '';
    if (label)  label.textContent = (theme === 'dark') ? (DICT['sett.darkMode'] ? DICT['sett.darkMode'][lang] || 'Dark' : 'Dark') : (lang === 'am' ? 'ብርሃን' : lang === 'or' ? 'Iftuu' : 'Light');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // ── Expose global helper for settings page ────────────────
  window.MESOB_PREFS = {
    applyAll: applyAll,
    DICT: DICT
  };

})();

// ============================================================
// MESOB - Service Window Controller
// Own collection: servicewindows
// ============================================================
const ServiceWindow = require('../models/ServiceWindow');

// @desc  Get all windows (PUBLIC) — sorted by windowId
// @route GET /api/services
exports.getAllWindows = async (req, res, next) => {
  try {
    const windows = await ServiceWindow.find().sort({ order: 1, windowId: 1 });
    res.json({ success: true, count: windows.length, data: windows });
  } catch (err) { next(err); }
};

// @desc  Create a new window (ADMIN)
// @route POST /api/services
exports.createWindow = async (req, res, next) => {
  try {
    const { name, nameEN, title, titleEN, titleAM, floor, services } = req.body;
    if (!name || !nameEN) {
      return res.status(400).json({ success: false, message: 'name and nameEN are required.' });
    }
    // Auto-assign next windowId
    const last = await ServiceWindow.findOne().sort({ windowId: -1 });
    const nextId = last ? last.windowId + 1 : 1;

    const win = await ServiceWindow.create({
      windowId: nextId,
      name, nameEN,
      title:    title   || '',
      titleEN:  titleEN || '',
      titleAM:  titleAM || '',
      floor:    floor   || 'Ground Floor',
      services: services || [],
      order:    nextId,
    });
    res.status(201).json({ success: true, message: 'Window created.', data: win });
  } catch (err) { next(err); }
};

// @desc  Seed all windows at once (ADMIN) — used on first setup
// @route POST /api/services/seed
exports.seedWindows = async (req, res, next) => {
  try {
    const { windows } = req.body;
    if (!Array.isArray(windows) || !windows.length) {
      return res.status(400).json({ success: false, message: 'windows array required.' });
    }
    const results = [];
    for (const w of windows) {
      const doc = await ServiceWindow.findOneAndUpdate(
        { windowId: w.id || w.windowId },
        {
          windowId: w.id || w.windowId,
          name:     w.name    || '',
          nameEN:   w.nameEN  || '',
          title:    w.title   || '',
          titleEN:  w.titleEN || '',
          titleAM:  w.titleAM || '',
          floor:    w.floor   || 'Ground Floor',
          services: w.services || [],
          order:    w.id || w.windowId || 0,
        },
        { upsert: true, new: true }
      );
      results.push(doc);
    }
    res.json({ success: true, message: `${results.length} windows saved to database.`, count: results.length });
  } catch (err) { next(err); }
};

// @desc  Update a single window (ADMIN)
// @route PUT /api/services/:windowId
exports.updateWindow = async (req, res, next) => {
  try {
    const { name, nameEN, title, titleEN, titleAM, floor, services } = req.body;
    const win = await ServiceWindow.findOneAndUpdate(
      { windowId: Number(req.params.windowId) },
      { name, nameEN, title, titleEN, titleAM, floor, services },
      { new: true, runValidators: true }
    );
    if (!win) return res.status(404).json({ success: false, message: 'Window not found.' });
    res.json({ success: true, message: 'Window updated.', data: win });
  } catch (err) { next(err); }
};

// @desc  Sync servicesEN and servicesAM for all windows (ADMIN — one-time fix)
// @route POST /api/services/sync-languages
exports.syncLanguages = async (req, res, next) => {
  try {
    const AM_MAP = {
      'Resident ID Issuance':'የነዋሪ መታወቂያ ማውጣት','New Customer Reception & Water Bill':'አዲስ ደንበኛ መቀበልና የውሃ ቢል','IMX Association Legal Status':'የIMX ማህበር ህጋዊ ሁኔታ','Job Seeker Registration & Card Issuance':'የስራ ፈላጊ ምዝገባ እና ካርድ','Job Seeker Card Renewal':'የስራ ፈላጊ ካርድ ማደስ','Support Letter for Traders - Market Linkage':'ለነጋዴዎች የድጋፍ ደብዳቤ','Community Health Insurance Issuance':'የጤና ኢንሹራንስ መስጠት','Community Health Insurance Renewal':'የጤና ኢንሹራንስ ማደስ','IMX Association Support Packages':'የIMX ማህበር ፓኬጆች','Certificate for IMX to Investment':'ለIMX ወደ ኢንቨስትመንት ምስክር','Various Support Letters':'ልዩ ልዩ የድጋፍ ደብዳቤዎች','Billboard License Support':'የቦርድ ፈቃድ ድጋፍ','Audio Advertisement Permit Letter':'የድምጽ ማስታወቂያ ፈቃድ','Farmer Investment Transition Support':'ለገበሬ ኢንቨስትመንት ሽግግር ድጋፍ','Displaced Persons Investment Support Letter':'ለተፈናቀሉ ኢንቨስትመንት ድጋፍ','Support Letter for Teachers & Managers':'ለአስተማሪዎችና ሃላፊዎች ደብዳቤ','Infrastructure Support - Electricity, Road, Water':'የመሰረተ ልማት ድጋፍ','Various Complaints Handling':'ልዩ ልዩ ቅሬታዎች','Various Petitions Handling':'ልዩ ልዩ አቤቱታዎች','Government Employees Complaints':'የመንግስት ሰራተኞች ቅሬታ','Development Displaced Persons Complaint Resolution':'ለልማት ተፈናቅለው ቅሬታ ፍቺ','Teacher/School Manager Transfer':'የአስተማሪ ዝውውር','Lost Regional Certificate Grade 6 & 8':'የጠፋ ሰርተፊኬት ክፍል 6 እና 8','Private/NGO School License':'የግል ት/ቤት ፈቃድ','Government House Repair Permit':'የቤት ጥገና ፈቃድ','Govt/Private House Rent Payment':'የቤት ኪራይ ክፍያ','Slaughter Service License':'የፍሰቻ አገልግሎት ፈቃድ','Private Clinic License Issuance':'የግል ክሊኒክ ፈቃድ','Private Clinic License Renewal':'የግል ክሊኒክ ፈቃድ ማደስ','Design Review & Project Control':'የዲዛይን ግምገማ','Plan Coordination':'የዕቅድ ቅንጅት','Construction Industry Competence Registration':'የህንፃ ኢንዱስትሪ ብቃት ምዝገባ','Health Professional Competence Certificate':'የጤና ሙያ ብቃት','Health Professional Certificate Renewal':'የጤና ሙያ ምስክር ማደስ','Commercial Establishment Competence Certificate':'የንግድ ተቋም ብቃት','Commercial Establishment Certificate Renewal':'የንግድ ተቋም ምስክር ማደስ','Cultural Institution Professional License':'የባህል ተቋም ፈቃድ','Trade License - New, Renewal, Amendment, Cancellation':'የንግድ ፈቃድ','Trade Name Registration':'የንግድ ስም ምዝገባ','Mining Research License':'የማዕድን ምርምር ፈቃድ','Mining Research License Renewal':'የማዕድን ምርምር ፈቃድ ማደስ','Mining Production License':'የማዕድን ምርት ፈቃድ','Mining Production License Renewal':'የማዕድን ምርት ፈቃድ ማደስ','Mining Production Expansion':'የማዕድን ምርት ማስፋፊያ','Mining License Transfer':'የማዕድን ፈቃድ ዝውውር','Water Production License':'የውሃ ምርት ፈቃድ','Water Production License Renewal/Cancellation':'የውሃ ምርት ፈቃድ ማደስ','Driving License Renewal':'የሹፌርነት ፈቃድ ማደስ','Driving File Transfer':'የሹፌርነት ፋይል ዝውውር','New Driving License':'አዲስ የሹፌርነት ፈቃድ','Vehicle Deployment Permit':'የተሽከርካሪ አሰፋፈር ፈቃድ','Tariff Decision Publication':'የታሪፍ ውሳኔ','Agricultural Input Professional License':'የግብርና ግቤት ሙያ ፈቃድ','Veterinary Medicine Professional License':'የእንስሳት ሕክምና ሙያ ፈቃድ','AI Artificial Insemination License':'የሰው ሰራሽ ዘር ፈቃድ','Animal Feed License':'የእንስሳት መኖ ፈቃድ','Slaughter House License':'የፍሰቻ ቤት ፈቃድ','Poultry Farming License':'የዶሮ እርባታ ፈቃድ','Livestock Farming License':'የከብት እርባታ ፈቃድ','Electronics/Computer Repair Technician License':'የኤሌክትሮኒክስ ጥገና ቴክኒሺያን ፈቃድ','Network & CCTV Installation License':'የኔትወርክ እና CCTV ፈቃድ','Electronics Trade Professional License':'የኤሌክትሮኒክስ ንግድ ፈቃድ','Electronics Repair Professional License':'የኤሌክትሮኒክስ ጥገና ሙያ ፈቃድ','Private Employment Agency License':'የግል ኤጀንሲ ፈቃድ','Agency License Renewal':'የኤጀንሲ ፈቃድ ማደስ','Agency License Reinstatement':'የኤጀንሲ ፈቃድ መልሶ ማስቀጠል','Agency License Replacement':'የኤጀንሲ ፈቃድ ምትክ','Restore Licenses & release security deposit':'ፈቃዶችን መልሶ ወደ ቀድሞ ሁኔታ','Agency License Cancellation':'የኤጀንሲ ፈቃድ መሰረዝ','Social Association License':'የማህበራዊ ማህበር ፈቃድ','Labour Dispute Handling':'የሰራተኛ አለመግባባት','Housing Cooperative Legal Status':'የቤቶች ህብረት ማህበር ህጋዊ ሁኔታ','Government House Rent Agreement':'የቤት ኪራይ ውል','Private House Rent Verification':'የግል ቤት ኪራይ ማረጋገጥ','Joint Building Agreement':'የጋራ ሕንፃ ውል','Annual Seal/Stamp Renewal':'ዓመታዊ ማህተም ማደስ','Vehicle Ban/Lift':'የተሽከርካሪ እገዳ','Private Record Amendment/Block/Unblock':'የግል መዝገብ ማሻሻል','Lost Vehicle Document Replacement':'የጠፋ ሰነድ ምትክ','Vehicle Ownership Transfer':'የባለቤትነት ዝውውር','Transportation Service License or Renewal':'የትራንስፖርት ፈቃድ','Civil Document Registration Service':'የሲቪል ሰነድ ምዝገባ','Civil Document Authentication Service':'የሲቪል ሰነድ ማረጋገጫ','Private Limited Company Establishment':'የግል ኩባንያ ማቋቋም','Small and Micro Enterprise Registration':'የጥቃቅን ድርጅት ምዝገባ','Association Document Registration & Authentication':'የማህበር ሰነድ ምዝገባ','Agreement Registration - Sale, Gift, Equipment Rental':'ውል ምዝገባ','Loan Agreement Registration':'የብድር ውል ምዝገባ','Translation/Interpretation Authentication':'የትርጉም ማረጋገጫ','Special Power of Agency':'ልዩ የወኪልነት ስልጣን','Approval of Cooperative Organizations':'የህብረት ስራ ማጽደቅ','Investment Project Reception':'የኢንቨስትመንት ፕሮጀክት መቀበያ','Investment License - New, Renewal, Replacement':'የኢንቨስትመንት ፈቃድ','New Investment Project Agreement Signing':'አዲስ ፕሮጀክት ውል','Investment Incentive License':'የኢንቨስትመንት ማበረታቻ','Investment Project Expansion':'የፕሮጀክት ማስፋፊያ','Investment Project Type Change':'የፕሮጀክት አይነት ለውጥ','Environmental Impact Assessment':'የአካባቢ ተፅዕኖ ምዘና','Environmental Protection TOR Approval':'የአካባቢ ጥበቃ TOR','Environmental Impact Audit':'የአካባቢ ኦዲት','Land Dispute Complaint Resolution':'የመሬት አለመግባባት ፍቺ','Land Holding Card Registration & Issuance':'የመሬት ይዞታ ካርድ','Document Clearance':'ሰነድ ማጽዳት','Name Transfer':'ስም ዝውውር','Cancellation of Court Injunction':'የፍርድ ቤት እግድ መሰረዝ','Merge Parcel':'ቦታ ማዋሃድ','Parcel Split':'ቦታ መከፋፈል','Lease Agreement Registration':'የሊዝ ውል ምዝገባ','Property Correction':'የንብረት ማስተካከያ','Property Valuation':'የንብረት ዋጋ ግምት','Lost Document Replacement':'የጠፋ ሰነድ ምትክ','Land Request Registration':'የመሬት ጥያቄ ምዝገባ','Land Use Change':'የመሬት አጠቃቀም ለውጥ','Land Use & Project Type Change':'የመሬት አጠቃቀምና ፕሮጀክት ለውጥ','Condominium Registration':'የኮንዶሚኒየም ምዝገባ','Cadastre Name Transfer':'የካዳስትር ስም ዝውውር','Registration of Representative Document':'የወኪል ሰነድ ምዝገባ','Digital Card Registration & Issuance':'የዲጂታል ካርድ ምዝገባ','Lease Agreement Renewal':'የሊዝ ውል ማደስ','Record Block/Amendment/Unblock':'መዝገብ ማገድ/ማሻሻል','Tax Identification Number (TIN)':'የግብር መለያ ቁጥር (TIN)','Regular Revenue Collection':'መደበኛ ገቢ አሰባሰብ','Withholding Revenue Collection':'ቀናሽ ገቢ አሰባሰብ','Tax Assessment - VAT, TOT, Withholding':'የግብር ምዘና','Tax Receipt Printing Support':'የግብር ደረሰኝ ድጋፍ','Debt Clearance Certificate':'የዕዳ ነፃ ምስክር','Audit Report':'የኦዲት ሪፖርት','Revenue Accounting':'የገቢ ሒሳብ','Voluntary Contribution Collection':'ዕርዳታ አሰባሰብ','Legal Affairs Revenue Collection':'የህግ ጉዳዮች ገቢ','Transport Revenue Collection':'የትራንስፖርት ገቢ','Drinking Water Revenue':'የጠጣር ውሃ ገቢ','Compensation Payment Expert x2':'ካሳ ክፍያ ባለሙያ x2','Project Payment Expert x2':'የፕሮጀክት ክፍያ ባለሙያ x2','Development Displaced Persons Loan Expert x1':'ብድር ባለሙያ x1','Various Service Payment Expert x2':'ልዩ ልዩ አገልግሎት ክፍያ ባለሙያ x2','Procurement & Service Expert x2':'የግዥ እና አገልግሎት ባለሙያ x2',
    };

    function extractEN(svc) {
      // Format 2: "Oromo (qualifier) - English description"
      const d = svc.lastIndexOf(' - ');
      if (d !== -1) { const a = svc.slice(d+3).trim(); if (!a.includes(')')) return a; }
      // Format 1: "Oromo text (English text)"
      const lo = svc.lastIndexOf('('), lc = svc.lastIndexOf(')');
      if (lo !== -1 && lc > lo) return svc.slice(lo+1, lc).trim();
      // Pure Oromo — check if it maps to English via AM_MAP reverse
      // (services from Excel have no English — return cleaned Oromo for now)
      return svc.replace(/^\d+[\.\)]\s*/, '').trim();
    }

    const windows = await ServiceWindow.find();
    let updated = 0;
    for (const w of windows) {
      const enList = (w.services || []).map(extractEN);
      const amList = enList.map((en) => AM_MAP[en] || en);
      await ServiceWindow.findByIdAndUpdate(w._id, { servicesEN: enList, servicesAM: amList });
      updated++;
    }
    res.json({ success: true, message: `Synced ${updated} windows with trilingual service names.`, updated });
  } catch (err) { next(err); }
};
exports.deleteWindow = async (req, res, next) => {
  try {
    const win = await ServiceWindow.findOneAndDelete({ windowId: Number(req.params.windowId) });
    if (!win) return res.status(404).json({ success: false, message: 'Window not found.' });
    res.json({ success: true, message: 'Window deleted.' });
  } catch (err) { next(err); }
};

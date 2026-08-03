// ============================================================
// MESOB - Site Content Controller
// Admin can update website content (contact info, announcements, etc.)
// ============================================================
const SiteContent = require('../models/SiteContent');

// Default content
const DEFAULTS = {
  contact_phone:       '+251 11 551 2345',
  contact_phone2:      '+251 11 551 6789',
  contact_email:       'info@mesob.gov.et',
  contact_address:     'Sululta, Oromia, Ethiopia',
  working_hours:       'Mon–Fri: 8:00 AM – 5:00 PM',
  working_sat:         'Saturday: 8:00 AM – 12:00 PM',
  site_title:          'One Stop Service Center (MESOB) Sululta',
  about_para1:         'MESOB (Modern Ethiopian Services for Organized Benefit) is Ethiopia\'s first unified one-stop government service platform.',
  about_para2:         'Citizens no longer need to travel to multiple offices.',
  about_para3:         'The MESOB Sululta Branch opened in July 2026, serving the Sululta community.',
  announcements:       [],
  // Site-wide defaults set by admin — applied to public frontend
  site_default_lang:   'or',
  site_default_theme:  'light',
  allow_anonymous_complaints: true,
};

// @desc  Get all site content (PUBLIC)
// @route GET /api/content
exports.getContent = async (req, res, next) => {
  try {
    const items = await SiteContent.find();
    const content = { ...DEFAULTS };
    items.forEach((item) => { content[item.key] = item.value; });
    res.json({ success: true, data: content });
  } catch (err) {
    next(err);
  }
};

// @desc  Update site content (ADMIN)
// @route PUT /api/content
exports.updateContent = async (req, res, next) => {
  try {
    const updates = req.body;
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const item = await SiteContent.findOneAndUpdate(
        { key },
        { value, updatedBy: req.admin.name },
        { upsert: true, new: true }
      );
      results.push(item);
    }
    res.json({ success: true, message: 'Content updated successfully.', count: results.length });
  } catch (err) {
    next(err);
  }
};

// @desc  Add announcement (ADMIN)
// @route POST /api/content/announcement
exports.addAnnouncement = async (req, res, next) => {
  try {
    const { title, excerpt, category } = req.body;
    if (!title || !excerpt) return res.status(400).json({ success: false, message: 'Title and excerpt required.' });

    let item = await SiteContent.findOne({ key: 'announcements' });
    const announcements = item ? item.value : [];
    const newAnn = {
      id: Date.now(),
      title,
      excerpt,
      category: category || 'General',
      date: new Date().toISOString().split('T')[0],
      isNew: true,
    };
    announcements.unshift(newAnn);

    await SiteContent.findOneAndUpdate(
      { key: 'announcements' },
      { value: announcements, updatedBy: req.admin.name },
      { upsert: true }
    );
    res.status(201).json({ success: true, message: 'Announcement added.', data: newAnn });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete announcement (ADMIN)
// @route DELETE /api/content/announcement/:id
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = await SiteContent.findOne({ key: 'announcements' });
    if (!item) return res.status(404).json({ success: false, message: 'No announcements found.' });
    const filtered = item.value.filter((a) => a.id !== id);
    await SiteContent.findOneAndUpdate({ key: 'announcements' }, { value: filtered });
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    next(err);
  }
};

// @desc  Add FAQ (ADMIN)
// @route POST /api/content/faq
exports.addFAQ = async (req, res, next) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ success: false, message: 'Question and answer required.' });
    let item = await SiteContent.findOne({ key: 'faqs' });
    const faqs = item ? item.value : [];
    const newFAQ = { id: Date.now(), question, answer };
    faqs.push(newFAQ);
    await SiteContent.findOneAndUpdate({ key: 'faqs' }, { value: faqs, updatedBy: req.admin.name }, { upsert: true });
    res.status(201).json({ success: true, message: 'FAQ added.', data: newFAQ });
  } catch (err) { next(err); }
};

// @desc  Delete FAQ (ADMIN)
// @route DELETE /api/content/faq/:id
exports.deleteFAQ = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = await SiteContent.findOne({ key: 'faqs' });
    if (!item) return res.status(404).json({ success: false, message: 'No FAQs found.' });
    const filtered = item.value.filter((f) => f.id !== id);
    await SiteContent.findOneAndUpdate({ key: 'faqs' }, { value: filtered });
    res.json({ success: true, message: 'FAQ deleted.' });
  } catch (err) { next(err); }
};
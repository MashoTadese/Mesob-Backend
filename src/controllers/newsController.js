// ============================================================
// MESOB - News Controller
// ============================================================
const News = require('../models/News');
const path = require('path');
const fs   = require('fs');

// ── Helper: extract YouTube video ID ──
function getYouTubeId(url) {
  if (!url) return '';
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return '';
}

// @desc  Get all published news (PUBLIC)
// @route GET /api/news
exports.getPublishedNews = async (req, res, next) => {
  try {
    const { limit = 20, page = 1, category } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;

    const total = await News.countDocuments(filter);
    const items = await News.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, total, data: items });
  } catch (err) { next(err); }
};

// @desc  Get single news post for admin (includes drafts)
// @route GET /api/news/admin/:id
exports.getOneNewsAdmin = async (req, res, next) => {
  try {
    const item = await News.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'News not found.' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

// @desc  Get single news post (PUBLIC)
// @route GET /api/news/:id
exports.getOneNews = async (req, res, next) => {
  try {
    const item = await News.findById(req.params.id);
    if (!item || !item.isPublished)
      return res.status(404).json({ success: false, message: 'News not found.' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

// @desc  Get ALL news including drafts (ADMIN)
// @route GET /api/news/admin/all
exports.getAllNewsAdmin = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const total = await News.countDocuments();
    const items = await News.find()
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.json({ success: true, total, data: items });
  } catch (err) { next(err); }
};

// @desc  Create news post (ADMIN)
// @route POST /api/news
exports.createNews = async (req, res, next) => {
  try {
    const {
      titleEN, titleAM, titleOR,
      bodyEN, bodyAM, bodyOR,
      type, videoUrl, category, isPublished
    } = req.body;

    if (!titleEN) return res.status(400).json({ success: false, message: 'English title is required.' });

    const newsData = {
      titleEN, titleAM: titleAM || '', titleOR: titleOR || '',
      bodyEN:  bodyEN  || '', bodyAM:  bodyAM  || '', bodyOR:  bodyOR  || '',
      type:    type    || 'text',
      category: category || 'General',
      isPublished: isPublished === 'true' || isPublished === true,
      publishedAt: (isPublished === 'true' || isPublished === true) ? new Date() : null,
      postedBy: req.admin ? req.admin.name : 'Admin',
    };

    // Handle YouTube URL
    if (type === 'video' && videoUrl) {
      const vid = getYouTubeId(videoUrl);
      newsData.videoUrl = vid ? `https://www.youtube.com/embed/${vid}` : videoUrl;
    }

    // Handle uploaded image — Cloudinary returns URL in req.file.path or req.file.secure_url
    if (req.file) {
      newsData.imageUrl  = req.file.path || req.file.secure_url || `/uploads/news/${req.file.filename}`;
      newsData.imageUrls = [newsData.imageUrl];
    } else if (req.files && req.files.length > 0) {
      const urls = req.files.map(f => f.path || f.secure_url || `/uploads/news/${f.filename}`);
      newsData.imageUrl  = urls[0];
      newsData.imageUrls = urls;
    }

    const item = await News.create(newsData);
    res.status(201).json({ success: true, message: 'News created.', data: item });
  } catch (err) { next(err); }
};

// @desc  Update news post (ADMIN)
// @route PUT /api/news/:id
exports.updateNews = async (req, res, next) => {
  try {
    const {
      titleEN, titleAM, titleOR,
      bodyEN, bodyAM, bodyOR,
      type, videoUrl, category, isPublished
    } = req.body;

    const existing = await News.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'News not found.' });

    const update = {
      titleEN: titleEN || existing.titleEN,
      titleAM: titleAM !== undefined ? titleAM : existing.titleAM,
      titleOR: titleOR !== undefined ? titleOR : existing.titleOR,
      bodyEN:  bodyEN  !== undefined ? bodyEN  : existing.bodyEN,
      bodyAM:  bodyAM  !== undefined ? bodyAM  : existing.bodyAM,
      bodyOR:  bodyOR  !== undefined ? bodyOR  : existing.bodyOR,
      type:    type    || existing.type,
      category: category || existing.category,
    };

    // Handle publish toggle
    const pub = isPublished === 'true' || isPublished === true;
    update.isPublished = pub;
    if (pub && !existing.publishedAt) update.publishedAt = new Date();
    if (!pub) update.publishedAt = null;

    // Handle YouTube URL
    if (type === 'video' && videoUrl) {
      const vid = getYouTubeId(videoUrl);
      update.videoUrl = vid ? `https://www.youtube.com/embed/${vid}` : videoUrl;
    }

    // Handle new uploaded image — Cloudinary returns URL in req.file.path or req.file.secure_url
    if (req.file) {
      update.imageUrl  = req.file.path || req.file.secure_url || `/uploads/news/${req.file.filename}`;
      update.imageUrls = [update.imageUrl];
    } else if (req.files && req.files.length > 0) {
      const urls = req.files.map(f => f.path || f.secure_url || `/uploads/news/${f.filename}`);
      update.imageUrl  = urls[0];
      update.imageUrls = urls;
    }

    const item = await News.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, message: 'News updated.', data: item });
  } catch (err) { next(err); }
};

// @desc  Toggle publish status (ADMIN)
// @route PUT /api/news/:id/publish
exports.togglePublish = async (req, res, next) => {
  try {
    const item = await News.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'News not found.' });
    item.isPublished = !item.isPublished;
    item.publishedAt = item.isPublished ? new Date() : null;
    await item.save();
    res.json({ success: true, message: `News ${item.isPublished ? 'published' : 'unpublished'}.`, data: item });
  } catch (err) { next(err); }
};

// @desc  Delete news post (ADMIN)
// @route DELETE /api/news/:id
exports.deleteNews = async (req, res, next) => {
  try {
    const item = await News.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'News not found.' });
    // Delete associated image if any
    if (item.imageUrl) {
      const imgPath = path.join(__dirname, '../../public/admin/uploads', item.imageUrl.replace('/uploads/', ''));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    res.json({ success: true, message: 'News deleted.' });
  } catch (err) { next(err); }
};

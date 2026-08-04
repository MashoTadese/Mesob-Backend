// ============================================================
// MESOB - Gallery Controller
// ============================================================
const Gallery = require('../models/Gallery');

// @desc  Get all published photos (PUBLIC)
// @route GET /api/gallery
exports.getPublished = async (req, res, next) => {
  try {
    const { category, limit = 50 } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    const items = await Gallery.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

// @desc  Get all photos including unpublished (ADMIN)
// @route GET /api/gallery/admin/all
exports.getAllAdmin = async (req, res, next) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

// @desc  Upload photo (ADMIN)
// @route POST /api/gallery
exports.createPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required.' });
    const { titleEN, titleAM, titleOR, category, isPublished } = req.body;
    const imageUrl = req.file.path || req.file.secure_url || `/uploads/gallery/${req.file.filename}`;
    const photo = await Gallery.create({
      titleEN: titleEN || '',
      titleAM: titleAM || '',
      titleOR: titleOR || '',
      imageUrl,
      category: category || 'General',
      isPublished: isPublished === 'false' ? false : true,
      uploadedBy: req.admin ? req.admin.name : 'Admin',
    });
    res.status(201).json({ success: true, data: photo });
  } catch (err) { next(err); }
};

// @desc  Update photo (ADMIN)
// @route PUT /api/gallery/:id
exports.updatePhoto = async (req, res, next) => {
  try {
    const { titleEN, titleAM, titleOR, category, isPublished } = req.body;
    const update = { titleEN, titleAM, titleOR, category };
    if (isPublished !== undefined) update.isPublished = isPublished === 'true' || isPublished === true;
    if (req.file) update.imageUrl = req.file.path || req.file.secure_url || `/uploads/gallery/${req.file.filename}`;
    const photo = await Gallery.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found.' });
    res.json({ success: true, data: photo });
  } catch (err) { next(err); }
};

// @desc  Toggle publish (ADMIN)
// @route PUT /api/gallery/:id/publish
exports.togglePublish = async (req, res, next) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found.' });
    photo.isPublished = !photo.isPublished;
    await photo.save();
    res.json({ success: true, data: photo });
  } catch (err) { next(err); }
};

// @desc  Delete photo (ADMIN)
// @route DELETE /api/gallery/:id
exports.deletePhoto = async (req, res, next) => {
  try {
    const photo = await Gallery.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found.' });
    res.json({ success: true, message: 'Photo deleted.' });
  } catch (err) { next(err); }
};

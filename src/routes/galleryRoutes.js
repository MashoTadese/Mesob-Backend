// ============================================================
// MESOB - Gallery Routes
// ============================================================
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { protect } = require('../middleware/auth');
const {
  getPublished, getAllAdmin, createPhoto, updatePhoto, togglePublish, deletePhoto
} = require('../controllers/galleryController');

// ── Multer — Cloudinary if configured, else local ──
let upload;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const cloudStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          'mesob_gallery',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation:  [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });
  upload = multer({ storage: cloudStorage, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
  const uploadDir = path.join(__dirname, '../../public/admin/uploads/gallery');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => cb(null, `gallery-${Date.now()}${path.extname(file.originalname)}`),
  });
  upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
}

// Public
router.get('/', getPublished);
// Admin
router.get('/admin/all',    protect, getAllAdmin);
router.post('/',            protect, upload.single('image'), createPhoto);
router.put('/:id/publish',  protect, togglePublish);
router.put('/:id',          protect, upload.single('image'), updatePhoto);
router.delete('/:id',       protect, deletePhoto);

module.exports = router;

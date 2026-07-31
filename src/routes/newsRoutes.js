// ============================================================
// MESOB - News Routes
// ============================================================
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { protect } = require('../middleware/auth');
const {
  getPublishedNews, getOneNews, getOneNewsAdmin, getAllNewsAdmin,
  createNews, updateNews, togglePublish, deleteNews,
} = require('../controllers/newsController');

// ── Multer — local disk storage ──
const uploadDir = path.join(__dirname, '../../public/admin/uploads/news');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    cb(null, `news-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Only images allowed.'));
  },
});

// ── Public routes ──
router.get('/',            getPublishedNews);

// ── Admin routes ──
router.get('/admin/all',   protect, getAllNewsAdmin);
router.get('/admin/:id',   protect, getOneNewsAdmin);
router.post('/',           protect, upload.array('images', 10), createNews);
router.put('/:id/publish', protect, togglePublish);
router.put('/:id',         protect, upload.array('images', 10), updateNews);
router.delete('/:id',      protect, deleteNews);

// ── Public single post ──
router.get('/:id', getOneNews);

module.exports = router;

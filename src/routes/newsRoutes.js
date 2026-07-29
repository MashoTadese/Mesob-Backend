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

// ── Multer setup for news images ──
const uploadDir = path.join(__dirname, '../../public/admin/uploads/news');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `news-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only images are allowed.'));
  },
});

// ── Public routes ──
router.get('/',             getPublishedNews);

// ── Admin routes (MUST be before /:id to avoid param conflict) ──
router.get('/admin/all',          protect, getAllNewsAdmin);
router.get('/admin/:id',          protect, getOneNewsAdmin);
router.post('/',                  protect, upload.single('image'), createNews);
router.put('/:id/publish',        protect, togglePublish);
router.put('/:id',                protect, upload.single('image'), updateNews);
router.delete('/:id',             protect, deleteNews);

// ── Public single post (last, so specific routes above take priority) ──
router.get('/:id',          getOneNews);

module.exports = router;

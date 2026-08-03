// ============================================================
// MESOB - Admin Routes
// ============================================================
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { protect, adminOnly } = require('../middleware/auth');
const {
  register, login, getMe, getAllAdmins, getDashboard,
  updateProfile, changePassword, uploadAvatar,
  forgotPassword, resetPassword,
} = require('../controllers/adminController');

// Multer storage for avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/admin/uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.admin._id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// Public
router.post('/register',         register);
router.post('/login',            login);
router.post('/forgot-password',  forgotPassword);
router.post('/reset-password',   resetPassword);

// Protected
router.get('/me',              protect, getMe);
router.get('/dashboard',       protect, getDashboard);
router.get('/all',             protect, adminOnly, getAllAdmins);
router.put('/profile',         protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/avatar',         protect, upload.single('avatar'), uploadAvatar);

module.exports = router;

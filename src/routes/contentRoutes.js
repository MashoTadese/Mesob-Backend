// ============================================================
// MESOB - Content Routes
// ============================================================
const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const { getContent, updateContent, addAnnouncement, deleteAnnouncement, addFAQ, deleteFAQ } = require('../controllers/contentController');

// Public
router.get('/', getContent);

// Admin only
router.put('/',                       protect, updateContent);
router.post('/announcement',          protect, addAnnouncement);
router.delete('/announcement/:id',    protect, deleteAnnouncement);
router.post('/faq',                   protect, addFAQ);
router.delete('/faq/:id',             protect, deleteFAQ);

module.exports = router;

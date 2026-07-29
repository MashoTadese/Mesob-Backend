// ============================================================
// MESOB - Contact Routes
// ============================================================
const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const {
  submitMessage,
  getAllMessages,
  markRead,
  deleteMessage,
  replyToMessage,
} = require('../controllers/contactController');

// Public
router.post('/',              submitMessage);

// Admin protected
router.get('/',               protect, getAllMessages);
router.put('/:id/read',       protect, markRead);
router.post('/:id/reply',     protect, replyToMessage);
router.delete('/:id',         protect, deleteMessage);

module.exports = router;

// ============================================================
// MESOB - Complaint Routes
// ============================================================
const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const {
  submitComplaint,
  getAllComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  getStats,
  getAnalytics,
} = require('../controllers/complaintController');

// Public
router.post('/',           submitComplaint);

// Admin protected
router.get('/analytics',   protect, getAnalytics);
router.get('/stats',       protect, getStats);
router.get('/',            protect, getAllComplaints);
router.get('/:id',         protect, getComplaint);
router.put('/:id',         protect, updateComplaint);
router.delete('/:id',      protect, deleteComplaint);

module.exports = router;

// ============================================================
// MESOB - Service Window Routes
// ============================================================
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllWindows, createWindow, seedWindows, updateWindow, deleteWindow, syncLanguages
} = require('../controllers/serviceWindowController');

// Public
router.get('/', getAllWindows);

// Admin — specific routes BEFORE /:windowId to avoid conflicts
router.post('/seed',              protect, seedWindows);
router.post('/sync-languages',    protect, syncLanguages);
router.post('/',                  protect, createWindow);
router.put('/:windowId',          protect, updateWindow);
router.delete('/:windowId',       protect, deleteWindow);

module.exports = router;

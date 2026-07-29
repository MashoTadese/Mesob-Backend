// ============================================================
// MESOB - Service Requirement Routes
// ============================================================
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getAll, getOne, create, update, remove, seed } = require('../controllers/requirementController');

// Public
router.get('/',                  getAll);
router.get('/:serviceName',      getOne);

// Admin
router.post('/seed',             protect, seed);
router.post('/',                 protect, create);
router.put('/:id',               protect, update);
router.delete('/:id',            protect, remove);

module.exports = router;

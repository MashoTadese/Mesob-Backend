// ============================================================
// MESOB - Site Content Model
// Admin can update website content from the panel
// ============================================================
const mongoose = require('mongoose');

const SiteContentSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true },
  value:     { type: mongoose.Schema.Types.Mixed, required: true },
  updatedBy: { type: String, default: 'admin' },
}, { timestamps: true });

module.exports = mongoose.model('SiteContent', SiteContentSchema);

// ============================================================
// MESOB - Gallery Model
// ============================================================
const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  titleEN:     { type: String, default: '' },
  titleAM:     { type: String, default: '' },
  titleOR:     { type: String, default: '' },
  imageUrl:    { type: String, required: true },
  category:    { type: String, default: 'General' },
  isPublished: { type: Boolean, default: true },
  uploadedBy:  { type: String, default: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Gallery', GallerySchema);

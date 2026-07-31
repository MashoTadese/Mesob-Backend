// ============================================================
// MESOB - News Model
// Supports: text, image (uploaded), video (YouTube embed)
// ============================================================
const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  // Trilingual titles
  titleEN: { type: String, required: true },
  titleAM: { type: String, default: '' },
  titleOR: { type: String, default: '' },

  // Trilingual body/description
  bodyEN:  { type: String, default: '' },
  bodyAM:  { type: String, default: '' },
  bodyOR:  { type: String, default: '' },

  // Media
  type:        { type: String, enum: ['text', 'image', 'video'], default: 'text' },
  imageUrl:    { type: String, default: '' },       // single image (legacy)
  imageUrls:   { type: [String], default: [] },     // multiple images
  videoUrl:    { type: String, default: '' },        // YouTube URL

  // Category tag
  category:    { type: String, default: 'General' },

  // Status
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date, default: null },

  // Author
  postedBy:    { type: String, default: 'Admin' },

}, { timestamps: true });

module.exports = mongoose.model('News', NewsSchema);

// ============================================================
// MESOB - Service Requirement Model
// Trilingual: English, Amharic, Afaan Oromo
// One document per service — no duplication
// ============================================================
const mongoose = require('mongoose');

const ServiceRequirementSchema = new mongoose.Schema({
  // English service name — unique lookup key
  serviceName:      { type: String, required: true, unique: true },

  // Required documents — 3 languages (array of strings)
  requirementsEN:   { type: [String], default: [] },
  requirementsAM:   { type: [String], default: [] },
  requirementsOR:   { type: [String], default: [] },

  // Processing time — 3 languages
  processingTimeEN: { type: String, default: '' },
  processingTimeAM: { type: String, default: '' },
  processingTimeOR: { type: String, default: '' },

  // Fee — 3 languages
  feeEN:            { type: String, default: '' },
  feeAM:            { type: String, default: '' },
  feeOR:            { type: String, default: '' },

  // Steps to follow — 3 languages
  stepsEN:          { type: [String], default: [] },
  stepsAM:          { type: [String], default: [] },
  stepsOR:          { type: [String], default: [] },

  // Window info
  window:           { type: String, default: '' },
  windowOrder:      { type: Number, default: 99 },

  // Legacy fields — kept so old seeded documents still return their data
  requirements:     { type: [String] },
  processingTime:   { type: String },
  fee:              { type: String },
  steps:            { type: [String] },

}, { timestamps: true, strict: false });

module.exports = mongoose.model('ServiceRequirement', ServiceRequirementSchema);

// ============================================================
// MESOB - Service Window Model
// Each window has a name, titles in 3 languages, floor, and a list of services
// ============================================================
const mongoose = require('mongoose');

const ServiceWindowSchema = new mongoose.Schema({
  windowId:   { type: Number, required: true, unique: true },
  name:       { type: String, required: true },               // Afaan Oromo name e.g. "Fooddaa 1ffaa"
  nameEN:     { type: String, required: true },               // English name e.g. "Window 1"
  nameAM:     { type: String, default: '' },                  // Amharic name
  title:      { type: String, default: '' },                  // Category title in Afaan Oromo
  titleEN:    { type: String, default: '' },                  // Category title in English
  titleAM:    { type: String, default: '' },                  // Category title in Amharic
  floor:      { type: String, default: 'Ground Floor',
                enum: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor'] },
  // Service lists — OR is the base (bilingual OR+EN format)
  // EN and AM are optional overrides; if empty, EN is extracted from OR string, AM uses EN
  services:   { type: [String], default: [] },                // Bilingual Oromo(English) format — base
  servicesEN: { type: [String], default: [] },                // Pure English override (optional)
  servicesAM: { type: [String], default: [] },                // Amharic override (optional)
  order:      { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ServiceWindow', ServiceWindowSchema);

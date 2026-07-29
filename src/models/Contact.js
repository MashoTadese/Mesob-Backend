// ============================================================
// MESOB - Contact Message Model
// ============================================================
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  phone:    { type: String, default: '' },
  subject:  { type: String, required: true },
  message:  { type: String, required: true, minlength: 20 },
  isRead:   { type: Boolean, default: false },
  reply:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Contact', ContactSchema);

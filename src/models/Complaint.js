// ============================================================
// MESOB - Complaint Model
// ============================================================
const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  // Submitter info
  fullName:    { type: String, default: 'Anonymous' },
  email:       { type: String, default: '' },
  phone:       { type: String, default: '' },
  anonymous:   { type: Boolean, default: false },

  // Complaint details
  department:  { type: String, required: true },
  type:        { type: String, required: true,
                 enum: ['delay','conduct','corruption','missing','wrong','access','other'] },
  complaint:   { type: String, required: true, minlength: 30 },

  // Status management
  status:      { type: String, default: 'pending',
                 enum: ['pending','under_review','resolved','rejected'] },
  response:    { type: String, default: '' },
  respondedBy: { type: String, default: '' },
  respondedAt: { type: Date },

  // Reference number for citizen to track
  refNumber:   { type: String, unique: true },

  // Timestamps
}, { timestamps: true });

// Auto-generate reference number — uses timestamp to avoid race condition
ComplaintSchema.pre('save', async function () {
  if (!this.refNumber) {
    const ts  = Date.now().toString().slice(-6);
    const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
    this.refNumber = `CMP-${ts}-${rnd}-${new Date().getFullYear()}`;
  }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);

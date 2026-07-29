// ============================================================
// MESOB - Admin User Model
// ============================================================
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true, minlength: 8 },
  role:       { type: String, default: 'superadmin', enum: ['superadmin'] },
  isActive:   { type: Boolean, default: true },
  lastLogin:  { type: Date },
  avatar:     { type: String, default: '' },
  phone:      { type: String, default: '' },
  position:   { type: String, default: '' },
}, { timestamps: true });

// Hash password before saving
AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
AdminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);

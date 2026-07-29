// ============================================================
// MESOB - Admin Auth Controller
// ============================================================
const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');
const path  = require('path');
const fs    = require('fs');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @desc  Register admin (only works if NO admin exists yet — one-time setup)
// @route POST /api/admin/register
exports.register = async (req, res, next) => {
  try {
    // Block if any admin already exists
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(403).json({ success: false, message: 'Admin already exists. Registration is locked.' });
    }
    const { name, email, password } = req.body;
    const admin = await Admin.create({ name, email, password, role: 'superadmin' });
    const token = signToken(admin._id);
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      token,
      data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Login admin
// @route POST /api/admin/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    if (!admin.isActive)
      return res.status(401).json({ success: false, message: 'Account is deactivated.' });
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });
    const token = signToken(admin._id);
    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, avatar: admin.avatar, phone: admin.phone, position: admin.position },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get current admin profile
// @route GET /api/admin/me
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.admin });
};

// @desc  Update profile (name, phone, position)
// @route PUT /api/admin/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, position } = req.body;
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { name, phone, position },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, message: 'Profile updated.', data: admin });
  } catch (err) {
    next(err);
  }
};

// @desc  Change password
// @route PUT /api/admin/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both current and new password required.' });
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });

    const admin = await Admin.findById(req.admin._id);
    if (!(await admin.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc  Upload profile picture
// @route POST /api/admin/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const avatarUrl = `/admin/uploads/${req.file.filename}`;

    // Delete old avatar if exists
    const admin = await Admin.findById(req.admin._id);
    if (admin.avatar && admin.avatar.includes('/uploads/')) {
      const oldPath = path.join(__dirname, '../../public', admin.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updated = await Admin.findByIdAndUpdate(req.admin._id, { avatar: avatarUrl }, { new: true }).select('-password');
    res.json({ success: true, message: 'Profile picture updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc  Get all admins
// @route GET /api/admin/all
exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: admins.length, data: admins });
  } catch (err) {
    next(err);
  }
};

// @desc  Dashboard summary stats
// @route GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const Complaint = require('../models/Complaint');
    const Contact   = require('../models/Contact');
    const [totalComplaints, pendingComplaints, resolvedComplaints, totalMessages, unreadMessages] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Contact.countDocuments(),
      Contact.countDocuments({ isRead: false }),
    ]);
    const recentComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(5)
      .select('refNumber department type status createdAt fullName anonymous');
    const recentMessages = await Contact.find().sort({ createdAt: -1 }).limit(5)
      .select('name email subject isRead createdAt');
    res.json({
      success: true,
      data: { stats: { totalComplaints, pendingComplaints, resolvedComplaints, totalMessages, unreadMessages }, recentComplaints, recentMessages },
    });
  } catch (err) {
    next(err);
  }
};

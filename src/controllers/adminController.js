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

// @desc  Forgot password — send reset email
// @route POST /api/admin/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(404).json({ success: false, message: 'No admin account found with that email.' });

    // Generate a secure random token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to DB with 1-hour expiry
    admin.resetPasswordToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    admin.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await admin.save({ validateBeforeSave: false });

    // Build reset URL
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:5000';
    const resetUrl = `${adminUrl}/admin/reset-password.html?token=${resetToken}`;

    // Send email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to:   admin.email,
      subject: 'MESOB Admin — Password Reset Request',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e9ecf0;border-radius:12px">
          <h2 style="color:#0F1F5C;margin-bottom:8px">Password Reset Request</h2>
          <p style="color:#374151">Hello <strong>${admin.name}</strong>,</p>
          <p style="color:#374151">You requested to reset your MESOB admin password. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#0F1F5C;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Reset Password</a>
          <p style="color:#6b7280;font-size:13px">This link expires in <strong>1 hour</strong>. If you did not request this, ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e9ecf0;margin:20px 0">
          <p style="color:#9ca3af;font-size:11px">MESOB Sululta Branch — Admin Panel</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Password reset link sent to ' + admin.email });
  } catch (err) {
    next(err);
  }
};

// @desc  Reset password using token
// @route POST /api/admin/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    // Hash the token to find the matching admin
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const admin = await Admin.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });

    // Set new password and clear reset fields
    admin.password            = password;
    admin.resetPasswordToken  = undefined;
    admin.resetPasswordExpire = undefined;
    await admin.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

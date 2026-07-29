// ============================================================
// MESOB - Auth Middleware (JWT Protection)
// ============================================================
const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-password');
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Admin not found.' });
    }
    // Block deactivated admins even if their token is still valid
    if (!req.admin.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.admin && req.admin.role === 'superadmin') return next();
  return res.status(403).json({ success: false, message: 'Admin role required.' });
};

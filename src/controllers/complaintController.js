// ============================================================
// MESOB - Complaint Controller
// ============================================================
const Complaint = require('../models/Complaint');
const { notifyNewComplaint, sendEmail } = require('../config/email');

// @desc  Submit a new complaint (PUBLIC)
// @route POST /api/complaints
exports.submitComplaint = async (req, res, next) => {
  try {
    const { fullName, email, phone, department, type, complaint, anonymous } = req.body;

    if (!department || !type || !complaint) {
      return res.status(400).json({ success: false, message: 'department, type, and complaint are required.' });
    }

    const newComplaint = await Complaint.create({
      fullName:   anonymous ? 'Anonymous' : (fullName || 'Anonymous'),
      email:      anonymous ? ''          : (email    || ''),
      phone:      anonymous ? ''          : (phone    || ''),
      anonymous:  !!anonymous,
      department,
      type,
      complaint,
    });

    res.status(201).json({
      success:   true,
      message:   'Complaint submitted successfully.',
      refNumber: newComplaint.refNumber,
      data: {
        refNumber:   newComplaint.refNumber,
        department:  newComplaint.department,
        type:        newComplaint.type,
        status:      newComplaint.status,
        submittedAt: newComplaint.createdAt,
      },
    });

    // Send email notification (non-blocking)
    notifyNewComplaint(newComplaint);
  } catch (err) {
    console.error('Complaint submit error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all complaints (ADMIN)
// @route GET /api/complaints
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status, type, department, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)     filter.status     = status;
    if (type)       filter.type       = type;
    if (department) filter.department = department;

    const total     = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page:    Number(page),
      pages:   Math.ceil(total / limit),
      data:    complaints,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single complaint (ADMIN)
// @route GET /api/complaints/:id
exports.getComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
};

// @desc  Update complaint status / respond (ADMIN)
// @route PUT /api/complaints/:id
exports.updateComplaint = async (req, res, next) => {
  try {
    const { status, response } = req.body;
    const update = { status };
    if (response) {
      update.response    = response;
      update.respondedBy = req.admin.name;
      update.respondedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Send email response to complainant if they provided email and a response was written
    if (response && complaint.email && !complaint.anonymous) {
      await sendEmail({
        to: complaint.email,
        subject: `Response to Your Complaint — ${complaint.refNumber} | MESOB Sululta`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1E3578;padding:20px;border-radius:8px 8px 0 0">
              <h2 style="color:#F5C400;margin:0">Response to Your Complaint</h2>
              <p style="color:rgba(255,255,255,0.7);margin:4px 0 0">MESOB Sululta Branch</p>
            </div>
            <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb">
              <p>Dear <strong>${complaint.fullName}</strong>,</p>
              <p style="margin:12px 0">Thank you for submitting your complaint. Here is our response to your concern:</p>
              <div style="background:#fff;border-left:4px solid #1E3578;padding:16px;border-radius:4px;margin:16px 0">
                <p style="font-weight:600;color:#1E3578;margin-bottom:8px">Reference #: ${complaint.refNumber}</p>
                <p style="font-weight:600;margin-bottom:6px">Status: <span style="color:${status==='resolved'?'#059669':'#1d4ed8'}">${status.replace('_',' ').toUpperCase()}</span></p>
                <p style="font-weight:600;margin:12px 0 6px">Our Response:</p>
                <p style="color:#374151;line-height:1.6">${response}</p>
              </div>
              <p style="color:#6b7280;font-size:13px">If you have further questions, please visit our office or contact us at +251 11 551 2345.</p>
              <p style="color:#6b7280;font-size:13px;margin-top:8px">Thank you for helping us improve our services.</p>
            </div>
            <div style="background:#e5e7eb;padding:12px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px">
              MESOB Sululta Branch — One Stop Service Center
            </div>
          </div>
        `,
      });
    }

    res.json({ success: true, message: 'Complaint updated.', data: complaint });
  } catch (err) {
    next(err);
  }
};

// @desc  Get complaint stats (ADMIN dashboard)
// @route GET /api/complaints/stats
exports.getStats = async (req, res, next) => {
  try {
    const total        = await Complaint.countDocuments();
    const pending      = await Complaint.countDocuments({ status: 'pending' });
    const underReview  = await Complaint.countDocuments({ status: 'under_review' });
    const resolved     = await Complaint.countDocuments({ status: 'resolved' });
    const rejected     = await Complaint.countDocuments({ status: 'rejected' });

    // By type
    const byType = await Complaint.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // By department
    const byDepartment = await Complaint.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: { total, pending, underReview, resolved, rejected, byType, byDepartment },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete complaint (ADMIN)
// @route DELETE /api/complaints/:id
exports.deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, message: 'Complaint deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc  Get complaint analytics
// @route GET /api/complaints/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const [byType, byDept, byMonth, byStatus] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Complaint.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      Complaint.aggregate([
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
      ]),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    res.json({ success: true, data: { byType, byDept, byMonth, byStatus } });
  } catch (err) { next(err); }
};
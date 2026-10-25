// ============================================================
// MESOB - Contact Controller
// ============================================================
const Contact = require('../models/Contact');
const { notifyNewMessage, sendEmail } = require('../config/email');

// @desc  Submit contact message (PUBLIC)
// @route POST /api/contact
exports.submitMessage = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const msg = await Contact.create({ name, email, phone, subject, message });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will respond within 1-2 business days.',
      data:    { id: msg._id, submittedAt: msg.createdAt },
    });

    // Send email notification (non-blocking)
    notifyNewMessage(msg);
  } catch (err) {
    next(err);
  }
};

// @desc  Get all messages (ADMIN)
// @route GET /api/contact
exports.getAllMessages = async (req, res, next) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const total    = await Contact.countDocuments(filter);
    const messages = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, data: messages });
  } catch (err) {
    next(err);
  }
};

// @desc  Mark message as read (ADMIN)
// @route PUT /api/contact/:id/read
exports.markRead = async (req, res, next) => {
  try {
    const msg = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete message (ADMIN)
// @route DELETE /api/contact/:id
exports.deleteMessage = async (req, res, next) => {
  try {
    const msg = await Contact.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    next(err);
  }
};

// @desc  Reply to contact message via email (ADMIN)
// @route POST /api/contact/:id/reply
exports.replyToMessage = async (req, res, next) => {
  try {
    const { replyText } = req.body;
    if (!replyText) return res.status(400).json({ success: false, message: 'Reply text is required.' });

    const msg = await Contact.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });

    // Send email reply to sender
    const result = await sendEmail({
      to: msg.email,
      subject: `Re: ${msg.subject} | MESOB Sululta Branch`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#1E3578;padding:20px;border-radius:8px 8px 0 0">
            <h2 style="color:#F5C400;margin:0">Reply from MESOB Sululta Branch</h2>
          </div>
          <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb">
            <p>Dear <strong>${msg.name}</strong>,</p>
            <p style="margin:12px 0">Thank you for contacting MESOB Sululta Branch. Here is our response to your inquiry:</p>
            <div style="background:#fff;border-left:4px solid #F5C400;padding:16px;border-radius:4px;margin:16px 0">
              <p style="font-weight:600;color:#1E3578;margin-bottom:8px">Your subject: ${msg.subject}</p>
              <p style="font-weight:600;margin:12px 0 6px">Our Reply:</p>
              <p style="color:#374151;line-height:1.6">${replyText}</p>
            </div>
            <p style="color:#6b7280;font-size:13px">For further assistance, visit us or call +251 11 551 2345.</p>
          </div>
          <div style="background:#e5e7eb;padding:12px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px">
            MESOB Sululta Branch  One Stop Service Center
          </div>
        </div>
      `,
    });

    // Mark as read and save reply
    await Contact.findByIdAndUpdate(req.params.id, { isRead: true, reply: replyText });

    if (result.sent) {
      res.json({ success: true, message: `Reply sent to ${msg.email}`, emailSent: true });
    } else if (result.reason === 'invalid_domain') {
      res.json({ success: true, message: `Reply saved but email NOT delivered — "${msg.email}" appears to be a fake or invalid email address.`, emailSent: false, emailFailReason: 'invalid_domain' });
    } else {
      res.json({ success: true, message: `Reply saved but email could not be sent to ${msg.email}. Reason: ${result.reason}`, emailSent: false, emailFailReason: result.reason });
    }
  } catch (err) {
    next(err);
  }
};
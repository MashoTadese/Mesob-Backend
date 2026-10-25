// ============================================================
// MESOB - Email Service (Nodemailer)
// ============================================================
const nodemailer = require('nodemailer');

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5000';

const transporter = nodemailer.createTransport({
  host:    process.env.EMAIL_HOST,
  port:    Number(process.env.EMAIL_PORT) || 587,
  secure:  (Number(process.env.EMAIL_PORT) || 587) === 465,
  family:  4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email helper — returns { sent: bool, reason: string }
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
    console.log('📧 Email not configured — skipping notification');
    return { sent: false, reason: 'not_configured' };
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'MESOB Sululta <noreply@mesob.gov.et>',
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to} — MessageId: ${info.messageId}`);
    return { sent: true, reason: 'sent' };
  } catch (err) {
    console.error(`❌ Email error sending to ${to}:`, err.message);
    return { sent: false, reason: 'smtp_error', error: err.message };
  }
};

// New complaint notification to admin
const notifyNewComplaint = (complaint) => sendEmail({
  to:      process.env.NOTIFY_ADMIN_EMAIL || process.env.EMAIL_USER,
  subject: `New Complaint Received — ${complaint.refNumber}`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1E3578;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="color:#F5C400;margin:0">⚠️ New Complaint — MESOB Sululta</h2>
      </div>
      <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb">
        <p><strong>Reference #:</strong> ${complaint.refNumber}</p>
        <p><strong>From:</strong> ${complaint.anonymous ? 'Anonymous' : complaint.fullName}</p>
        <p><strong>Department:</strong> ${complaint.department}</p>
        <p><strong>Type:</strong> ${complaint.type}</p>
        <p><strong>Submitted:</strong> ${new Date(complaint.createdAt).toLocaleString()}</p>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:12px">
          <p><strong>Complaint:</strong></p>
          <p style="color:#374151">${complaint.complaint}</p>
        </div>
        <a href="${ADMIN_URL}/admin/complaints.html"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1E3578;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          View in Admin Panel →
        </a>
      </div>
      <div style="background:#e5e7eb;padding:12px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px">
        MESOB Sululta Branch — One Stop Service Center
      </div>
    </div>
  `,
});

// New contact message notification to admin
const notifyNewMessage = (msg) => sendEmail({
  to:      process.env.NOTIFY_ADMIN_EMAIL || process.env.EMAIL_USER,
  subject: `New Message: ${msg.subject} — MESOB`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1E3578;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="color:#F5C400;margin:0">✉️ New Message — MESOB Sululta</h2>
      </div>
      <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb">
        <p><strong>From:</strong> ${msg.name} (${msg.email})</p>
        <p><strong>Subject:</strong> ${msg.subject}</p>
        <p><strong>Date:</strong> ${new Date(msg.createdAt).toLocaleString()}</p>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:12px">
          <p>${msg.message}</p>
        </div>
        <a href="${ADMIN_URL}/admin/messages.html"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1E3578;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          View in Admin Panel →
        </a>
      </div>
    </div>
  `,
});

module.exports = { sendEmail, notifyNewComplaint, notifyNewMessage };

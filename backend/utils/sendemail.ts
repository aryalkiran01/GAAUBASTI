export {};
const nodemailer = require('nodemailer');

let transporterCache = null;

const getTransporter = () => {
  if (transporterCache) return transporterCache;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporterCache = nodemailer.createTransport({
    host,
    port: parseInt(port || '587', 10),
    secure: parseInt(port || '587', 10) === 465,
    auth: { user, pass },
  });

  return transporterCache;
};

const isEmailConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Email] SMTP not configured — would send to ${to}: ${subject}`);
    }
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const fromName = process.env.SMTP_FROM_NAME || 'Gaun Basti';
  const fromEmail = process.env.SMTP_USER;

  await (transporter as any).sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text,
    html: html || text,
  });

  return { sent: true };
};

module.exports = sendEmail;
module.exports.isEmailConfigured = isEmailConfigured;

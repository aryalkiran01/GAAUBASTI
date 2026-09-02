export {};

const formatCurrency = (amount, currency = 'USD') => {
  const symbol = currency === 'USD' ? '$' : '';
  return `${symbol}${Number(amount).toFixed(2)}`;
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const emailTemplates = {
  booking_created: (data) => ({
    subject: `Booking confirmed — ${data.listingTitle || 'Your stay'}`,
    text: `Hi ${data.guestName},\n\nYour booking for "${data.listingTitle}" from ${formatDate(data.startDate)} to ${formatDate(data.endDate)} has been created. Total: ${formatCurrency(data.totalPrice, data.currency)}.\n\nWe're processing your payment now. You'll receive a confirmation once it's complete.\n\n— Gaun Basti`,
    html: `<h2>Hi ${data.guestName},</h2><p>Your booking for <strong>${data.listingTitle}</strong> from ${formatDate(data.startDate)} to ${formatDate(data.endDate)} has been created.</p><p><strong>Total:</strong> ${formatCurrency(data.totalPrice, data.currency)}</p><p>We're processing your payment now. You'll receive a confirmation once it's complete.</p><p>— Gaun Basti</p>`,
  }),

  booking_confirmed: (data) => ({
    subject: `Payment confirmed — ${data.listingTitle || 'Your stay'}`,
    text: `Hi ${data.guestName},\n\nYour payment of ${formatCurrency(data.amount, data.currency)} for "${data.listingTitle}" has been confirmed. Your booking is now fully confirmed!\n\nCheck-in: ${formatDate(data.startDate)}\nCheck-out: ${formatDate(data.endDate)}\n\n— Gaun Basti`,
    html: `<h2>Hi ${data.guestName},</h2><p>Your payment of <strong>${formatCurrency(data.amount, data.currency)}</strong> for "${data.listingTitle}" has been confirmed. Your booking is now fully confirmed!</p><p><strong>Check-in:</strong> ${formatDate(data.startDate)}<br><strong>Check-out:</strong> ${formatDate(data.endDate)}</p><p>— Gaun Basti</p>`,
  }),

  booking_cancelled: (data) => ({
    subject: `Booking cancelled — ${data.listingTitle || 'Your stay'}`,
    text: `Hi ${data.guestName},\n\nYour booking for "${data.listingTitle}" from ${formatDate(data.startDate)} to ${formatDate(data.endDate)} has been cancelled.\n\n${data.refundAmount > 0 ? `A refund of ${formatCurrency(data.refundAmount, data.currency)} will be processed.` : 'No refund is available for this cancellation.'}\n\n— Gaun Basti`,
    html: `<h2>Hi ${data.guestName},</h2><p>Your booking for <strong>${data.listingTitle}</strong> from ${formatDate(data.startDate)} to ${formatDate(data.endDate)} has been cancelled.</p>${data.refundAmount > 0 ? `<p>A refund of <strong>${formatCurrency(data.refundAmount, data.currency)}</strong> will be processed.</p>` : '<p>No refund is available for this cancellation.</p>'}<p>— Gaun Basti</p>`,
  }),

  refund_processed: (data) => ({
    subject: `Refund processed — ${formatCurrency(data.amount, data.currency)}`,
    text: `Hi ${data.guestName},\n\nA refund of ${formatCurrency(data.amount, data.currency)} has been processed for your booking at "${data.listingTitle}". The refund may take 5-10 business days to appear on your statement.\n\n— Gaun Basti`,
    html: `<h2>Hi ${data.guestName},</h2><p>A refund of <strong>${formatCurrency(data.amount, data.currency)}</strong> has been processed for your booking at "${data.listingTitle}".</p><p>The refund may take 5-10 business days to appear on your statement.</p><p>— Gaun Basti</p>`,
  }),

  new_message: (data) => ({
    subject: `New message from ${data.senderName}`,
    text: `Hi ${data.recipientName},\n\nYou have a new message from ${data.senderName}:\n\n"${data.preview}"\n\nLog in to view and reply.\n\n— Gaun Basti`,
    html: `<h2>Hi ${data.recipientName},</h2><p>You have a new message from <strong>${data.senderName}</strong>:</p><blockquote>${data.preview}</blockquote><p>Log in to view and reply.</p><p>— Gaun Basti</p>`,
  }),

  payout_created: (data) => ({
    subject: `Payout of ${formatCurrency(data.amount, data.currency)} — ${data.period}`,
    text: `Hi ${data.hostName},\n\nA payout of ${formatCurrency(data.amount, data.currency)} for the period ${data.period} has been initiated. You'll be notified once it's processed.\n\n— Gaun Basti`,
    html: `<h2>Hi ${data.hostName},</h2><p>A payout of <strong>${formatCurrency(data.amount, data.currency)}</strong> for the period ${data.period} has been initiated.</p><p>You'll be notified once it's processed.</p><p>— Gaun Basti</p>`,
  }),

  review_reminder: (data) => ({
    subject: `Share your experience — ${data.listingTitle || 'your recent stay'}`,
    text: `Hi ${data.guestName},\n\nHow was your stay at "${data.listingTitle}"? We'd love to hear your feedback. Leaving a review helps other travelers and supports your host.\n\nLog in to leave a review.\n\n— Gaun Basti`,
    html: `<h2>Hi ${data.guestName},</h2><p>How was your stay at <strong>${data.listingTitle}</strong>? We'd love to hear your feedback.</p><p>Leaving a review helps other travelers and supports your host. Log in to leave a review.</p><p>— Gaun Basti</p>`,
  }),

  otp: (data) => ({
    subject: `Your verification code`,
    text: `Hi,\n\nYour verification code is: ${data.otp}\n\nThis code expires in 10 minutes. If you didn't request this, please ignore this email.\n\n— Gaun Basti`,
    html: `<h2>Hi,</h2><p>Your verification code is:</p><h1 style="letter-spacing:4px;font-size:32px">${data.otp}</h1><p>This code expires in 10 minutes. If you didn't request this, please ignore this email.</p><p>— Gaun Basti</p>`,
  }),

  email_verification: (data) => ({
    subject: 'Verify your Gaun Basti account',
    text: `Hi ${data.name},\n\nPlease verify your account by visiting: ${data.verifyUrl}\n\nThis link expires in 24 hours.\n\n— Gaun Basti`,
    html: `<h2>Hi ${data.name},</h2><p>Please verify your account by clicking the link below:</p><p><a href="${data.verifyUrl}">${data.verifyUrl}</a></p><p>This link expires in 24 hours.</p><p>— Gaun Basti</p>`,
  }),
};

module.exports = emailTemplates;

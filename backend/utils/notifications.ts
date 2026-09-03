const Notification = require("../models/Notification");
const sendEmail = require("./sendemail");
const emailTemplates = require("./emailTemplates");
const { sendSMS, isSMSConfigured } = require("./sendSMS");

// ---------- Types ----------
interface NotificationContent {
  [key: string]: any;
}

interface NotificationParams {
  userId: string;
  type: string;
  content?: NotificationContent;
  message?: string;
}

// ---------- Helpers ----------
const emitToUser = (userId: string, event: string, payload: any): void => {
  if (global.io) {
    global.io.to(`user:${String(userId)}`).emit(event, payload);
  }
};

/**
 * Creates a single notification with deduplication.
 */
const createNotification = async ({
  userId,
  type,
  content = {},
  message = undefined,
}: NotificationParams): Promise<any> => {
  if (!userId) return null;

  const dedupKey = content?.dedupKey || `${type}:${String(userId)}`;

  const existing = await Notification.findOne({
    user: userId,
    "content.dedupKey": dedupKey,
  });
  if (existing) return existing;

  const notification = await Notification.create({
    user: userId,
    type,
    content: { ...content, dedupKey },
    message: message || content?.preview || type,
  });

  emitToUser(userId, "notification:new", {
    _id: notification._id,
    type,
    content,
    message: notification.message,
    read: false,
    createdAt: notification.createdAt,
  });

  return notification;
};

/**
 * Creates notifications for multiple users at once.
 */
const notifyUsers = async (
  userIds: string[] = [],
  type: string,
  content: NotificationContent = {},
): Promise<any[]> => {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(String))];
  if (uniqueUserIds.length === 0) return [];

  const dedupKey = content?.dedupKey || type;
  const existing = await Notification.find({
    user: { $in: uniqueUserIds },
    "content.dedupKey": dedupKey,
  });
  const existingUserIds = new Set(existing.map((n: any) => String(n.user)));
  const newUserIds = uniqueUserIds.filter((id) => !existingUserIds.has(id));

  if (newUserIds.length === 0) return existing;

  const notifications = await Notification.insertMany(
    newUserIds.map((userId) => ({
      user: userId,
      type,
      content: { ...content, dedupKey },
    })),
  );

  notifications.forEach((notification: any) => {
    emitToUser(notification.user, "notification:new", {
      _id: notification._id,
      type,
      content,
      read: false,
      createdAt: notification.createdAt,
    });
  });

  return [...existing, ...notifications];
};

const sendTransactionalEmail = async (
  templateKey: string,
  to: string,
  data: any,
): Promise<any> => {
  if (!to) return { sent: false, reason: "NO_RECIPIENT" };
  const template = emailTemplates[templateKey];
  if (!template) return { sent: false, reason: "TEMPLATE_NOT_FOUND" };

  const { subject, text, html } = template(data);
  try {
    return await sendEmail({ to, subject, text, html });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[Email] Failed to send ${templateKey} to ${to}:`,
        error.message,
      );
    }
    return { sent: false, reason: "SEND_FAILED" };
  }
};

const sendTransactionalSMS = async (to: string, data: any): Promise<any> => {
  if (!to) return { sent: false, reason: "NO_RECIPIENT" };
  if (!isSMSConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[SMS] Twilio not configured — would send to ${to}`);
    }
    return { sent: false, reason: "SMS_NOT_CONFIGURED" };
  }
  try {
    return await sendSMS(to, data.body);
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[SMS] Failed to send to ${to}:`, error.message);
    }
    return { sent: false, reason: "SEND_FAILED" };
  }
};

// ---------- Notification Triggers ----------
const notifyBookingCreated = async ({
  booking,
  guest,
  host,
}: any): Promise<void> => {
  const content = {
    bookingId: String(booking._id),
    listingTitle: booking.listing?.title || "Your stay",
    startDate: booking.startDate,
    endDate: booking.endDate,
    preview: `Booking created for ${booking.listing?.title || "your stay"}`,
    dedupKey: `booking_created:${booking._id}`,
  };

  await createNotification({
    userId: String(booking.guest),
    type: "booking_created",
    content,
  });
  if (host) {
    await createNotification({
      userId: String(booking.host),
      type: "new_booking",
      content,
    });
  }

  if (guest?.email) {
    await sendTransactionalEmail("booking_created", guest.email, {
      guestName: guest.name,
      listingTitle: booking.listing?.title,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      currency: booking.currency || "USD",
    });
  }
};

const notifyPaymentConfirmed = async ({
  booking,
  guest,
  host,
  payment,
}: any): Promise<void> => {
  const content = {
    bookingId: String(booking._id),
    paymentId: payment ? String(payment._id) : undefined,
    listingTitle: booking.listing?.title || "Your stay",
    preview: `Payment confirmed for ${booking.listing?.title || "your stay"}`,
    dedupKey: `payment_confirmed:${booking._id}:${payment?._id || ""}`,
  };

  await createNotification({
    userId: String(booking.guest),
    type: "payment_confirmed",
    content,
  });
  if (host) {
    await createNotification({
      userId: String(booking.host),
      type: "payment_received",
      content,
    });
  }

  if (guest?.email) {
    await sendTransactionalEmail("booking_confirmed", guest.email, {
      guestName: guest.name,
      listingTitle: booking.listing?.title,
      amount: payment?.amount || booking.totalPrice,
      currency: payment?.currency || booking.currency || "USD",
      startDate: booking.startDate,
      endDate: booking.endDate,
    });
  }
};

const notifyBookingCancelled = async ({
  booking,
  guest,
  host,
  refundAmount,
}: any): Promise<void> => {
  const content = {
    bookingId: String(booking._id),
    listingTitle: booking.listing?.title || "Your stay",
    refundAmount,
    preview: `Booking cancelled: ${booking.listing?.title || "your stay"}`,
    dedupKey: `booking_cancelled:${booking._id}`,
  };

  await createNotification({
    userId: String(booking.guest),
    type: "booking_cancelled",
    content,
  });
  if (host) {
    await createNotification({
      userId: String(booking.host),
      type: "booking_cancelled",
      content,
    });
  }

  if (guest?.email) {
    await sendTransactionalEmail("booking_cancelled", guest.email, {
      guestName: guest.name,
      listingTitle: booking.listing?.title,
      startDate: booking.startDate,
      endDate: booking.endDate,
      refundAmount: refundAmount || 0,
      currency: booking.currency || "USD",
    });
  }

  if (guest?.phone && refundAmount > 0) {
    await sendTransactionalSMS(guest.phone, {
      body: `Gaun Basti: Your booking for ${booking.listing?.title || "your stay"} has been cancelled. Refund of $${Number(refundAmount).toFixed(2)} will be processed.`,
    });
  }
};

const notifyRefundProcessed = async ({
  booking,
  guest,
  amount,
}: any): Promise<void> => {
  const content = {
    bookingId: String(booking._id),
    amount,
    preview: `Refund of $${Number(amount).toFixed(2)} processed`,
    dedupKey: `refund_processed:${booking._id}:${amount}`,
  };

  await createNotification({
    userId: String(booking.guest),
    type: "refund_processed",
    content,
  });

  if (guest?.email) {
    await sendTransactionalEmail("refund_processed", guest.email, {
      guestName: guest.name,
      listingTitle: booking.listing?.title,
      amount,
      currency: booking.currency || "USD",
    });
  }
};

const notifyNewMessage = async ({
  conversation,
  sender,
  recipient,
}: any): Promise<void> => {
  const content = {
    conversationId: String(conversation._id),
    senderName: sender?.name || "Someone",
    preview: `New message from ${sender?.name || "someone"}`,
    dedupKey: `new_message:${conversation._id}:${Date.now()}`,
  };

  await createNotification({
    userId: String(recipient._id),
    type: "new_message",
    content,
    message: content.preview,
  });

  if (recipient?.email) {
    await sendTransactionalEmail("new_message", recipient.email, {
      recipientName: recipient.name,
      senderName: sender?.name || "Someone",
      preview: content.preview,
    });
  }
};

const notifyPayoutCreated = async ({ payout, host }: any): Promise<void> => {
  const content = {
    payoutId: String(payout._id),
    amount: payout.amount,
    period: payout.period,
    preview: `Payout of $${Number(payout.amount).toFixed(2)} for ${payout.period}`,
    dedupKey: `payout_created:${payout._id}`,
  };

  await createNotification({
    userId: String(payout.host),
    type: "payout_created",
    content,
  });

  if (host?.email) {
    await sendTransactionalEmail("payout_created", host.email, {
      hostName: host.name,
      amount: payout.amount,
      currency: "USD",
      period: payout.period,
    });
  }
};

const notifyReviewReminder = async ({ booking, guest }: any): Promise<void> => {
  const content = {
    bookingId: String(booking._id),
    listingTitle: booking.listing?.title || "your recent stay",
    preview: `Share your experience at ${booking.listing?.title || "your stay"}`,
    dedupKey: `review_reminder:${booking._id}`,
  };

  await createNotification({
    userId: String(guest._id),
    type: "review_reminder",
    content,
  });

  if (guest?.email) {
    await sendTransactionalEmail("review_reminder", guest.email, {
      guestName: guest.name,
      listingTitle: booking.listing?.title,
    });
  }
};

const notifySafetyAlert = async ({ user, message }: any): Promise<void> => {
  const content = {
    preview: message,
    dedupKey: `safety_alert:${String(user._id)}:${Date.now()}`,
  };

  await createNotification({
    userId: String(user._id),
    type: "safety_alert",
    content,
    message,
  });

  if (user.phone) {
    await sendTransactionalSMS(user.phone, {
      body: `Gaun Basti Safety Alert: ${message}`,
    });
  }
};

// ---------- Exports ----------
module.exports = {
  createNotification,
  notifyUsers,
  emitToUser,
  notifyBookingCreated,
  notifyPaymentConfirmed,
  notifyBookingCancelled,
  notifyRefundProcessed,
  notifyNewMessage,
  notifyPayoutCreated,
  notifyReviewReminder,
  notifySafetyAlert,
  sendTransactionalEmail,
  sendTransactionalSMS,
};

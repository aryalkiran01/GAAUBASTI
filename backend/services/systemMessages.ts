import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Booking from '../models/Booking';

const getSystemMessageText = (systemType: string, listingTitle?: string): string => {
  const title = listingTitle ? `"${listingTitle}"` : 'your booking';

  switch (systemType) {
    case 'booking_created':
      return `Booking request created for ${title}.`;
    case 'booking_confirmed':
      return `Booking confirmed for ${title}.`;
    case 'booking_cancelled_guest':
      return `Booking for ${title} was cancelled by the guest.`;
    case 'booking_cancelled_host':
      return `Booking for ${title} was cancelled by the host.`;
    case 'payment_successful':
      return `Payment completed for ${title}.`;
    case 'refund_completed':
      return `Refund processed for ${title}.`;
    default:
      return 'System notification.';
  }
};

const ensureBookingConversation = async (booking: any) => {
  const participants = [booking.guest.toString(), booking.host.toString()].filter(
    (id, index, arr) => arr.indexOf(id) === index
  );

  let conversation = await Conversation.findOne({
    booking: booking._id,
    participants: { $all: participants, $size: participants.length }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants,
      listing: booking.listing,
      booking: booking._id,
      lastMessageAt: new Date()
    });
  }

  return conversation;
};

export const createSystemMessage = async (
  bookingId: string,
  systemType: string,
  actorId?: string
): Promise<void> => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('listing', 'title')
      .populate('guest', 'name')
      .populate('host', 'name');

    if (!booking) return;

    const conversation = await ensureBookingConversation(booking);

    const existing = await Message.findOne({
      conversation: conversation._id,
      systemType,
      sender: actorId || booking.guest._id
    });

    if (existing) return;

    const listingTitle = (booking.listing as any)?.title;
    const text = getSystemMessageText(systemType, listingTitle);

    const message = await Message.create({
      conversation: conversation._id,
      sender: actorId || booking.guest._id,
      body: text,
      systemType,
      readBy: [actorId || booking.guest._id]
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    if (global.io) {
      global.io.to(conversation._id.toString()).emit('message:new', {
        conversationId: conversation._id,
        message: {
          ...message.toObject(),
          sender: message.sender
        }
      });
    }
  } catch {
    // System messages are best-effort; don't block the parent operation
  }
};

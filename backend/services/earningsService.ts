export {};
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');

const PLATFORM_COMMISSION_RATE = 0.10;

const calculateHostEarnings = (booking: any): { grossRevenue: number; commissionAmount: number; hostEarnings: number } => {
  const grossRevenue = booking.totalPrice || 0;
  const commissionAmount = Math.round(grossRevenue * PLATFORM_COMMISSION_RATE * 100) / 100;
  const hostEarnings = Math.round((grossRevenue - commissionAmount) * 100) / 100;
  return { grossRevenue, commissionAmount, hostEarnings };
};

const createPaymentTransaction = async (booking: any, payment: any): Promise<void> => {
  const { grossRevenue, commissionAmount, hostEarnings } = calculateHostEarnings(booking);

  const existingTxn = await Transaction.findOne({ type: 'payment', payment: payment._id });
  if (existingTxn) return;

  await Transaction.create({
    type: 'payment',
    booking: booking._id,
    payment: payment._id,
    user: booking.guest,
    amount: grossRevenue,
    currency: 'USD',
    direction: 'debit',
    status: 'completed',
    description: `Payment for booking ${booking.bookingReference || booking._id}`,
    reference: payment.providerPaymentId || String(payment._id),
  commissionRate: PLATFORM_COMMISSION_RATE,
    commissionAmount,
    hostEarnings,
  });

  await Transaction.create({
    type: 'commission',
    booking: booking._id,
    payment: payment._id,
    user: booking.host,
    amount: commissionAmount,
    currency: 'USD',
    direction: 'debit',
    status: 'completed',
    description: `Platform commission for booking ${booking.bookingReference || booking._id}`,
    reference: payment.providerPaymentId || String(payment._id),
    commissionRate: PLATFORM_COMMISSION_RATE,
    commissionAmount,
    hostEarnings,
  });
};

const createRefundTransaction = async (booking: any, refundAmount: number, reference?: string): Promise<void> => {
  await Transaction.create({
    type: 'refund',
    booking: booking._id,
    user: booking.guest,
    amount: refundAmount,
    currency: 'USD',
    direction: 'credit',
    status: 'completed',
    description: `Refund for booking ${booking.bookingReference || booking._id}`,
    reference: reference || String(booking._id),
    commissionRate: PLATFORM_COMMISSION_RATE,
    commissionAmount: 0,
    hostEarnings: 0,
  });
};

const createPayoutTransaction = async (payout: any, hostId: string): Promise<void> => {
  await Transaction.create({
    type: 'payout',
    payout: payout._id,
    user: hostId,
    amount: payout.amount,
    currency: 'USD',
    direction: 'credit',
    status: 'completed',
    description: `Payout ${payout.period || payout._id}`,
    reference: payout.reference || String(payout._id),
  });
};

const getHostEarningsSummary = async (hostId: string) => {
  const [completedBookings, paidPayouts, pendingPayouts, refunds] = await Promise.all([
    Booking.aggregate([
      { $match: { host: hostId, status: 'completed', paymentStatus: 'paid' } },
      { $group: { _id: null, grossRevenue: { $sum: '$totalPrice' }, bookingCount: { $sum: 1 } } },
    ]),
    Payout.aggregate([
      { $match: { host: hostId, status: 'paid' } },
      { $group: { _id: null, paidOut: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payout.aggregate([
      { $match: { host: hostId, status: { $in: ['pending', 'approved'] } } },
      { $group: { _id: null, pending: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { user: hostId, type: 'refund', status: 'completed' } },
      { $group: { _id: null, totalRefunds: { $sum: '$amount' } } },
    ]),
  ]);

  const gross = completedBookings[0]?.grossRevenue || 0;
  const commission = Math.round(gross * PLATFORM_COMMISSION_RATE * 100) / 100;
  const netEarnings = Math.round((gross - commission) * 100) / 100;
  const paidOut = paidPayouts[0]?.paidOut || 0;
  const pending = pendingPayouts[0]?.pending || 0;
  const totalRefunds = refunds[0]?.totalRefunds || 0;
  const available = Math.max(0, netEarnings - paidOut - pending - totalRefunds);

  return {
    grossRevenue: gross,
    platformFees: commission,
    refunds: totalRefunds,
    netEarnings,
    pendingEarnings: pending,
    availableEarnings: available,
    paidEarnings: paidOut,
    completedBookingCount: completedBookings[0]?.bookingCount || 0,
  paidPayoutCount: paidPayouts[0]?.count || 0,
  pendingPayoutCount: pendingPayouts[0]?.count || 0,
  isManualPayout: true,
  platformCommissionRate: PLATFORM_COMMISSION_RATE,
  note: 'Payouts are processed manually. Stripe Connect automatic transfer is not yet implemented.',
  };
};

const getHostEarningsBreakdown = async (hostId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find({ host: hostId, status: 'completed', paymentStatus: 'paid' })
      .populate('listing', 'title')
      .populate('guest', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments({ host: hostId, status: 'completed', paymentStatus: 'paid' }),
  ]);

  const breakdown = bookings.map((booking: any) => {
    const { grossRevenue, commissionAmount, hostEarnings } = calculateHostEarnings(booking);
    return {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      listingTitle: booking.listing?.title || 'Unknown',
      guestName: booking.guest?.name || 'Unknown',
      date: booking.createdAt,
      grossRevenue,
      commissionAmount,
      hostEarnings,
      paymentStatus: booking.paymentStatus,
    };
  });

  return { breakdown, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total } };
};

module.exports = {
  calculateHostEarnings,
  createPaymentTransaction,
  createRefundTransaction,
  createPayoutTransaction,
  getHostEarningsSummary,
  getHostEarningsBreakdown,
  PLATFORM_COMMISSION_RATE,
};

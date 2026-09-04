import Payout from '../models/Payout.js';
import User from '../models/User.js';


const getMyPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ host: req.user._id }).sort({ createdAt: -1 });
    const summary = await Payout.aggregate([
      { $match: { host: req.user._id } },
      { $group: { _id: null, totalEarnings: { $sum: '$amount' }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } } } }
    ]);

    res.json({ success: true, data: { payouts, summary: summary[0] || { totalEarnings: 0, pending: 0 } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payouts', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const createPayout = async (req, res) => {
  try {
    const { hostId, amount, period, payoutMethod = 'manual', reference } = req.body;
    if (!hostId || !amount || !period) {
      return res.status(400).json({ success: false, message: 'Host, amount, and period are required' });
    }

    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }

    const payout = await Payout.create({
      host: hostId,
      amount: Number(amount),
      period,
      payoutMethod,
      reference,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: { payout } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create payout', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export { getMyPayouts, createPayout };
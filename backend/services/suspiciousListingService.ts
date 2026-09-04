import Listing from '../models/Listing.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';

export interface RiskFactor {
  factor: string;
  score: number;
}

export const calculateListingRiskScore = (listing: any, host: any): RiskFactor[] => {
  const factors: RiskFactor[] = [];

  if (!host || host.isVerified === false) {
    factors.push({ factor: 'Unverified host account', score: 20 });
  }

  if (host && host.hostVerificationStatus !== 'approved') {
    factors.push({ factor: 'Host identity not verified', score: 15 });
  }

  if (host && host.createdAt) {
    const accountAgeDays = (Date.now() - new Date(host.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < 7) {
      factors.push({ factor: 'Host account created less than 7 days ago', score: 15 });
    } else if (accountAgeDays < 30) {
      factors.push({ factor: 'Host account created less than 30 days ago', score: 8 });
    }
  }

  if (!listing.images || listing.images.length === 0) {
    factors.push({ factor: 'No images provided', score: 15 });
  } else if (listing.images.length === 1) {
    factors.push({ factor: 'Only one image provided', score: 5 });
  }

  if (!listing.description || listing.description.trim().length < 50) {
    factors.push({ factor: 'Very short or missing description', score: 10 });
  }

  if (listing.price !== undefined && listing.price !== null) {
    if (listing.price === 0) {
      factors.push({ factor: 'Price set to zero', score: 15 });
    } else if (listing.price < 100) {
      factors.push({ factor: 'Unusually low price', score: 10 });
    }
  }

  if (listing.maxGuests && listing.maxGuests > 20) {
    factors.push({ factor: 'Unusually high guest capacity', score: 5 });
  }

  if (!listing.amenities || listing.amenities.length === 0) {
    factors.push({ factor: 'No amenities listed', score: 5 });
  }

  return factors;
};

export const getTotalRiskScore = (factors: RiskFactor[]): number => {
  return Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));
};

export const scoreAndFlagListing = async (listingId: string): Promise<{ score: number; factors: string[]; status: string }> => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new Error('Listing not found');
  }

  const host = await User.findById(listing.host);
  const factors = calculateListingRiskScore(listing, host);
  const score = getTotalRiskScore(factors);

  listing.riskScore = score;
  listing.riskFactors = factors.map(f => `${f.factor} (${f.score}pts)`);

  if (score >= 40) {
    listing.moderationStatus = 'flagged';
  } else if (score >= 20) {
    listing.moderationStatus = 'pending';
  } else {
    listing.moderationStatus = 'approved';
  }

  await listing.save();

  return { score, factors: listing.riskFactors, status: listing.moderationStatus };
};

export const getSuspiciousListings = async (options: { page?: number; limit?: number; minScore?: number; status?: string }) => {
  const { page = 1, limit = 20, minScore = 20, status } = options;
  const skip = (page - 1) * limit;

  const filter: any = { riskScore: { $gte: minScore } };
  if (status) {
    filter.moderationStatus = status;
  }

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('host', 'name email hostVerificationStatus createdAt')
      .sort({ riskScore: -1 })
      .skip(skip)
      .limit(limit),
    Listing.countDocuments(filter)
  ]);

  return {
    listings,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalListings: total
    }
  };
};

export const moderateListing = async (listingId: string, adminId: string, action: 'approve' | 'reject' | 'flag', notes?: string) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new Error('Listing not found');
  }

  const statusMap = { approve: 'approved', reject: 'rejected', flag: 'flagged' };
  listing.moderationStatus = statusMap[action];
  listing.moderatedBy = adminId as any;
  listing.moderatedAt = new Date();
  if (notes) listing.adminNotes = notes;

  if (action === 'approve') {
    listing.isVerified = true;
    listing.verifiedAt = new Date();
    listing.verifiedBy = adminId as any;
  } else if (action === 'reject') {
    listing.isVerified = false;
  }

  await listing.save();
  await listing.populate('host', 'name email hostVerificationStatus');

  return listing;
};

export const getPendingHostVerifications = async (options: { page?: number; limit?: number }) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const filter = { hostVerificationStatus: 'pending' };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email username hostProfile hostVerificationDocuments hostVerifiedAt createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    }
  };
};

export const reviewHostVerification = async (userId: string, adminId: string, decision: 'approved' | 'rejected', notes?: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.hostVerificationStatus !== 'pending') {
    throw new Error('No pending verification request for this user');
  }

  user.hostVerificationStatus = decision;
  user.hostVerifiedAt = decision === 'approved' ? new Date() : null;
  user.hostVerifiedBy = adminId as any;
  if (notes) user.hostVerificationNotes = notes;

  if (decision === 'approved') {
    user.isVerified = true;
  }

  await user.save();

  return user;
};

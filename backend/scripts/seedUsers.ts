export {};
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

export interface SeedUserDef {
  name: string;
  username: string;
  email: string;
  plainPassword: string;
  role: 'guest' | 'host' | 'admin';
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  hostStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  hostProfile?: {
    bio?: string;
    languages?: string[];
    responseRate?: number;
    responseTime?: string;
  };
}

export const SEED_USERS: SeedUserDef[] = [
  {
    name: 'Gaun Basti Admin (गाउँ बस्ती व्यवस्थापक)',
    username: 'adminuser',
    email: 'admin@example.com',
    plainPassword: 'password',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&auto=format&fit=crop&q=80',
    phone: '+977 9801234567',
    isVerified: true,
    isActive: true,
    hostStatus: 'none',
  },
  {
    name: 'Dhan Maya Gurung (धनमाया गुरुङ)',
    username: 'hostuser',
    email: 'host@example.com',
    plainPassword: 'password',
    role: 'host',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    phone: '+977 9846123456',
    isVerified: true,
    isActive: true,
    hostStatus: 'approved',
    hostProfile: {
      bio: 'Registered Community Homestay Host under Nepal Tourism Board & Gaun Basti Stays Hub. Warmly welcoming travelers to experience living Gurung culture, authentic organic meals, and mountain serenity in Ghandruk.',
      languages: ['Nepali', 'Gurung', 'English', 'Hindi'],
      responseRate: 98,
      responseTime: 'within an hour',
    },
  },
  {
    name: 'Aarav Sharma (आरव शर्मा)',
    username: 'guestuser',
    email: 'guest@example.com',
    plainPassword: 'password',
    role: 'guest',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    phone: '+977 9812345678',
    isVerified: true,
    isActive: true,
    hostStatus: 'none',
  },
  {
    name: 'Kiran Aryal (किरण अर्याल)',
    username: 'kiranaryal',
    email: 'aryalkira1@gmail.com',
    plainPassword: 'password',
    role: 'guest',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    phone: '+977 9851098765',
    isVerified: true,
    isActive: true,
    hostStatus: 'none',
  },
  {
    name: 'Kiran Aryal Dev',
    username: 'kiranaryal21',
    email: 'aryalkiran21@gmail.com',
    plainPassword: 'password',
    role: 'guest',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    phone: '+977 9851098765',
    isVerified: true,
    isActive: true,
    hostStatus: 'none',
  },
];

/**
 * Safely inserts or updates the pre-seeded users.
 * Note: We pass plainPassword directly to user.password so Mongoose's pre('save')
 * hook executes a clean 12-round bcrypt hash without double-hashing.
 */
export const seedUsers = async () => {
  console.log('🌱 Seeding & upserting test user accounts (Admin, Host, Guest)...');
  const results = [];

  for (const userDef of SEED_USERS) {
    // Look up existing user by email
    let user = await User.findOne({ email: userDef.email.toLowerCase() });

    if (user) {
      // Update existing user safely
      user.name = userDef.name;
      user.username = userDef.username;
      user.password = userDef.plainPassword; // Triggers User.pre('save') for single clean bcrypt hash
      user.role = userDef.role;
      user.isVerified = userDef.isVerified;
      user.isActive = userDef.isActive;
      user.avatar = userDef.avatar || user.avatar;
      user.phone = userDef.phone || user.phone;
      user.failedLoginAttempts = 0;
      user.lockUntil = null;

      if (userDef.hostStatus) {
        user.hostStatus = userDef.hostStatus;
      }
      if (userDef.hostProfile) {
        user.hostProfile = {
          ...user.hostProfile,
          ...userDef.hostProfile,
        };
      }

      await user.save();
      console.log(`  ✅ Updated existing user: [${userDef.role.toUpperCase()}] ${userDef.email} (Password: ${userDef.plainPassword})`);
      results.push(user);
    } else {
      // Check if username conflict exists with another email
      const usernameConflict = await User.findOne({ username: userDef.username });
      const finalUsername = usernameConflict ? `${userDef.username}_${Date.now().toString().slice(-4)}` : userDef.username;

      user = await User.create({
        name: userDef.name,
        username: finalUsername,
        email: userDef.email.toLowerCase(),
        password: userDef.plainPassword, // Triggers User.pre('save') for single clean bcrypt hash
        role: userDef.role,
        avatar: userDef.avatar,
        phone: userDef.phone,
        isVerified: userDef.isVerified,
        isActive: userDef.isActive,
        hostStatus: userDef.hostStatus || 'none',
        hostProfile: userDef.hostProfile || {},
        failedLoginAttempts: 0,
        lockUntil: null,
      });

      console.log(`  ✨ Created new user: [${userDef.role.toUpperCase()}] ${userDef.email} (Password: ${userDef.plainPassword})`);
      results.push(user);
    }
  }

  console.log('✅ User seeding completed successfully.');
  return results;
};

// If run directly from terminal
if (require.main === module || (process.argv[1] && process.argv[1].includes('seedUsers'))) {
  (async () => {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gaubasti';
      console.log(`🔌 Connecting to MongoDB at ${uri}...`);
      await mongoose.connect(uri);
      console.log('🔌 Connected.');

      await seedUsers();

      console.log('\n======================================================');
      console.log('🎉 TEST ACCOUNTS READY IN MONGO:');
      console.log('------------------------------------------------------');
      SEED_USERS.forEach((u) => {
        console.log(`• Role: [${u.role.toUpperCase().padEnd(5)}] | Email: ${u.email.padEnd(24)} | Password: ${u.plainPassword}`);
      });
      console.log('======================================================\n');

      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ Failed to seed users:', err);
      process.exit(1);
    }
  })();
}

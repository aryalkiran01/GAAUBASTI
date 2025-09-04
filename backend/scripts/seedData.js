const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaunbasti')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const seedData = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Listing.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({})
    ]);

    console.log('🗑️  Cleared existing data');

    // Create users
    const hashedPassword = await bcrypt.hash('password', 12);
    
    const users = await User.create([
      {
        name: 'Guest User',
        email: 'guest@example.com',
        password: hashedPassword,
        role: 'guest',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
        isVerified: true
      },
      {
        name: 'Host User',
        email: 'host@example.com',
        password: hashedPassword,
        role: 'host',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
        isVerified: true,
        hostProfile: {
          bio: 'Passionate about sharing Nepali culture with travelers',
          languages: ['English', 'Nepali', 'Hindi'],
          responseRate: 95,
          responseTime: 'within an hour'
        }
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
        isVerified: true
      }
    ]);

    console.log('👥 Created users');

    // Create listings
    const hostUser = users.find(u => u.role === 'host');
    
    const listings = await Listing.create([
      {
        title: 'Riverside Cottage',
        description: 'A beautiful cottage by the river, perfect for a peaceful getaway. Experience traditional Nepali hospitality while enjoying modern comforts.',
        location: {
          address: 'Lakeside Road, Pokhara',
          city: 'Pokhara',
          state: 'Gandaki',
          country: 'Nepal',
          coordinates: {
            latitude: 28.2096,
            longitude: 83.9856
          }
        },
        price: 85,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            caption: 'Riverside view'
          },
          {
            url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            caption: 'Interior view'
          }
        ],
        amenities: ['Wi-Fi', 'Kitchen', 'Mountain view', 'Private entrance', 'Breakfast'],
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        host: hostUser._id,
        category: 'cottage',
        isVerified: true,
        verifiedAt: new Date(),
        averageRating: 4.9,
        reviewCount: 128
      },
      {
        title: 'Mountain View Villa',
        description: 'Luxurious villa with panoramic mountain views and modern amenities. Perfect for families and groups seeking comfort and stunning scenery.',
        location: {
          address: 'Nagarkot Hill Station',
          city: 'Nagarkot',
          state: 'Bagmati',
          country: 'Nepal',
          coordinates: {
            latitude: 27.7172,
            longitude: 85.5240
          }
        },
        price: 150,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            caption: 'Villa exterior'
          },
          {
            url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            caption: 'Living area'
          }
        ],
        amenities: ['Wi-Fi', 'Kitchen', 'Mountain view', 'Hot tub', 'Breakfast', 'Fireplace'],
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        host: hostUser._id,
        category: 'villa',
        isVerified: true,
        verifiedAt: new Date(),
        averageRating: 4.8,
        reviewCount: 95
      },
      {
        title: 'Traditional Mud House',
        description: 'Experience authentic Nepali living in this traditional mud house. Immerse yourself in local culture and traditional architecture.',
        location: {
          address: 'Old Bandipur',
          city: 'Bandipur',
          state: 'Gandaki',
          country: 'Nepal',
          coordinates: {
            latitude: 27.9317,
            longitude: 84.4204
          }
        },
        price: 45,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1590725140246-20acddc1ec6b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            caption: 'Traditional architecture'
          },
          {
            url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            caption: 'Interior design'
          }
        ],
        amenities: ['Local cuisine', 'Cultural experience', 'Garden', 'Valley view'],
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        host: hostUser._id,
        category: 'traditional',
        isVerified: true,
        verifiedAt: new Date(),
        averageRating: 4.7,
        reviewCount: 73
      }
    ]);

    console.log('🏠 Created listings');

    // Create bookings
    const guestUser = users.find(u => u.role === 'guest');
    
    const bookings = await Booking.create([
      {
        listing: listings[0]._id,
        guest: guestUser._id,
        host: hostUser._id,
        startDate: new Date('2024-02-10'),
        endDate: new Date('2024-02-15'),
        guests: { adults: 2, children: 0 },
        totalPrice: 425,
        priceBreakdown: {
          basePrice: 425,
          cleaningFee: 25,
          serviceFee: 42,
          taxes: 21
        },
        status: 'confirmed',
        paymentStatus: 'paid'
      },
      {
        listing: listings[2]._id,
        guest: guestUser._id,
        host: hostUser._id,
        startDate: new Date('2024-03-05'),
        endDate: new Date('2024-03-10'),
        guests: { adults: 2, children: 1 },
        totalPrice: 225,
        priceBreakdown: {
          basePrice: 225,
          cleaningFee: 25,
          serviceFee: 22,
          taxes: 11
        },
        status: 'pending',
        paymentStatus: 'pending'
      }
    ]);

    console.log('📅 Created bookings');

    // Create reviews
    await Review.create([
      {
        listing: listings[0]._id,
        guest: guestUser._id,
        booking: bookings[0]._id,
        rating: 5,
        comment: 'Amazing stay! The hosts were incredibly welcoming and the location was perfect. The traditional breakfast was a highlight of our trip.',
        ratings: {
          cleanliness: 5,
          communication: 5,
          checkIn: 5,
          accuracy: 5,
          location: 5,
          value: 5
        },
        isVerified: true
      }
    ]);

    console.log('⭐ Created reviews');

    console.log('🎉 Seed data created successfully!');
    console.log('\n📧 Demo accounts:');
    console.log('Guest: guest@example.com / password');
    console.log('Host: host@example.com / password');
    console.log('Admin: admin@example.com / password');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
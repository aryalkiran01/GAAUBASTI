export {};
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Village = require('../models/Village');
const Article = require('../models/Article');

const { seedVillages } = require('./seedVillages');
const { seedArticles } = require('./seedArticles');

if (process.env.NODE_ENV === 'production') {
  console.error('FATAL: seedData script cannot be executed in production environment!');
  process.exit(1);
}

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaunbasti');
    console.log(' Connected to MongoDB for Full Nepali Data Seeding');

    // Clear existing collection data
    await Promise.all([
      User.deleteMany({}),
      Listing.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({})
    ]);

    console.log(' Cleared existing user, listing, booking, and review collections');

    // 1. First seed authentic Nepali villages & articles
    await seedVillages();
    await seedArticles();

    // 2. Create Users with authentic Nepali profiles
    const hashedPassword = await bcrypt.hash('password', 12);
    
    const users = await User.create([
      {
        name: 'Aarav Sharma (आरव शर्मा)',
        username: 'guestuser',
        email: 'guest@example.com',
        password: hashedPassword,
        role: 'guest',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        isVerified: true
      },
      {
        name: 'Dhan Maya Gurung (धनमाया गुरुङ)',
        username: 'hostuser',
        email: 'host@example.com',
        password: hashedPassword,
        role: 'host',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        isVerified: true,
        hostProfile: {
          bio: 'Registered Community Homestay Host under Nepal Tourism Board & Gaun Basti Stays Hub. Warmly welcoming travelers to experience living Gurung culture, authentic organic meals, and mountain serenity in Ghandruk.',
          languages: ['Nepali', 'Gurung', 'English', 'Hindi'],
          responseRate: 98,
          responseTime: 'within an hour'
        }
      },
      {
        name: 'Gaun Basti Admin (गाउँ बस्ती व्यवस्थापक)',
        username: 'adminuser',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&auto=format&fit=crop&q=80',
        isVerified: true
      }
    ]);

    console.log(' Created authentic Nepali user profiles (Guest, Host, Admin)');

    const hostUser = users.find((u: any) => u.role === 'host');

    // 3. Create authentic Nepali homestay listings
    const listings = await Listing.create([
      {
        title: 'Annapurna View Gurung Heritage Homestay',
        description: 'Wake up to the golden sunrise over Machhapuchhre and Annapurna South. An authentic slate-roofed traditional stone homestay in the heart of Ghandruk village. Enjoy organic home-cooked meals, farm-fresh milk, and traditional Gurung hospitality.',
        location: {
          address: 'Upper Ghandruk, Near Gurung Museum',
          village: 'Ghandruk',
          city: 'Ghandruk',
          district: 'Kaski',
          province: 'Gandaki',
          state: 'Gandaki',
          country: 'Nepal',
          coordinates: {
            latitude: 28.3758,
            longitude: 83.8083
          },
          geoJSON: {
            type: 'Point',
            coordinates: [83.8083, 28.3758]
          }
        },
        price: 2500, // NPR per night
        images: [
          {
            url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
            caption: 'Panoramic balcony view of Machhapuchhre'
          },
          {
            url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
            caption: 'Traditional timber-and-slate bedroom'
          },
          {
            url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
            caption: 'Courtyard overlooking the Annapurna valley'
          }
        ],
        amenities: ['Wi-Fi', 'Hot Water', 'Breakfast Included', 'Organic Local Meals', 'Mountain View', 'Cultural Dance Experience', 'Trekking Guide Assistance'],
        houseRules: ['No smoking inside wooden rooms', 'Shoes off before entering hearth area', 'Quiet hours after 10 PM'],
        safetyHealth: {
          firstAidAvailable: true,
          nearestHospitalDistance: 'Annapurna Health Post (5 mins)',
          emergencyTransport: 'Local 4WD Jeep Stand (10 mins)',
          fireExtinguisher: true
        },
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        host: hostUser._id,
        category: 'homestay',
        isVerified: true,
        verifiedAt: new Date(),
        averageRating: 4.95,
        reviewCount: 42
      },
      {
        title: 'Bandipur Chhen Traditional Newari Homestay',
        description: 'Immerse yourself in 18th-century Newari heritage in Bandipur’s vehicle-free stone bazaar. Featuring hand-carved woodcraft, serene rooftop views of the Manaslu range, and authentic Newari Samay Baji dinners.',
        location: {
          address: 'Heritage Bazaar Street, Bandipur',
          village: 'Bandipur',
          city: 'Bandipur',
          district: 'Tanahun',
          province: 'Gandaki',
          state: 'Gandaki',
          country: 'Nepal',
          coordinates: {
            latitude: 27.9317,
            longitude: 84.4172
          },
          geoJSON: {
            type: 'Point',
            coordinates: [84.4172, 27.9317]
          }
        },
        price: 3200,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80',
            caption: 'Carved Newari timber facade'
          },
          {
            url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80',
            caption: 'Cozy heritage lounge'
          }
        ],
        amenities: ['Wi-Fi', 'Rooftop Mountain View', 'Authentic Samay Baji', 'Hot Shower', 'Balcony', 'Reading Lounge'],
        houseRules: ['Vehicles must be parked at main town gate', 'Respect local religious shrines'],
        safetyHealth: {
          firstAidAvailable: true,
          nearestHospitalDistance: 'Bandipur Hospital (1 km)',
          emergencyTransport: '24/7 Town Taxi Service',
          fireExtinguisher: true
        },
        maxGuests: 5,
        bedrooms: 3,
        bathrooms: 2,
        host: hostUser._id,
        category: 'traditional',
        isVerified: true,
        verifiedAt: new Date(),
        averageRating: 4.88,
        reviewCount: 36
      },
      {
        title: 'Sirubari Model Eco-Village Homestay',
        description: 'Experience Nepal’s pioneer PATA Gold Award winning community homestay in Sirubari. Enjoy warm Gurung hospitality, farm-to-table organic meals, and serene slate pathways amidst terraced hill slopes.',
        location: {
          address: 'Sirubari Model Village',
          village: 'Sirubari',
          city: 'Sirubari',
          district: 'Syangja',
          province: 'Gandaki',
          state: 'Gandaki',
          country: 'Nepal',
          coordinates: {
            latitude: 28.0833,
            longitude: 83.8447
          },
          geoJSON: {
            type: 'Point',
            coordinates: [83.8447, 28.0833]
          }
        },
        price: 1800,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1590725140246-20acddc1ec6b?w=800&auto=format&fit=crop&q=80',
            caption: 'Traditional Gurung courtyard'
          },
          {
            url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=80',
            caption: 'Handcrafted guest room'
          }
        ],
        amenities: ['Organic Farming Experience', 'Full Board Traditional Meals', 'Cultural Reception', 'Hot Water', 'Garden'],
        houseRules: ['Participate in village cleanliness norms', 'Smoking prohibited in village grounds'],
        safetyHealth: {
          firstAidAvailable: true,
          nearestHospitalDistance: 'Sirubari Sub-Health Post (300m)',
          emergencyTransport: 'Community Jeep on standby',
          fireExtinguisher: true
        },
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        host: hostUser._id,
        category: 'traditional',
        isVerified: true,
        verifiedAt: new Date(),
        averageRating: 4.92,
        reviewCount: 29
      }
    ]);

    console.log(' Created authentic Nepali homestay listings with GeoJSON coordinates');

    // 4. Create Bookings & Reviews
    const guestUser = users.find((u: any) => u.role === 'guest');
    const today = new Date();

    const bookings = await Booking.create([
      {
        listing: listings[0]._id,
        guest: guestUser._id,
        host: hostUser._id,
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8),
        guests: { adults: 2, children: 0 },
        totalPrice: 8300,
        priceBreakdown: {
          basePrice: 7500,
          cleaningFee: 300,
          serviceFee: 500,
          taxes: 0
        },
        status: 'confirmed',
        paymentStatus: 'paid'
      },
      {
        listing: listings[1]._id,
        guest: guestUser._id,
        host: hostUser._id,
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
        guests: { adults: 2, children: 1 },
        totalPrice: 10400,
        priceBreakdown: {
          basePrice: 9600,
          cleaningFee: 300,
          serviceFee: 500,
          taxes: 0
        },
        status: 'pending',
        paymentStatus: 'pending'
      }
    ]);

    await Review.create([
      {
        listing: listings[0]._id,
        guest: guestUser._id,
        booking: bookings[0]._id,
        rating: 5,
        comment: 'Dhan Maya didi and her family made us feel right at home in Ghandruk. The Dhindo dinner by the fireplace was delicious, and the sunrise over Annapurna from our balcony was unforgettable. Dhanyabaad Gaun Basti for connecting us!',
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

    console.log(' Created authentic Nepali booking records and guest reviews');
    console.log('\n=========================================');
    console.log(' GAUN BASTI NEPALI DATA SEEDING COMPLETE');
    console.log('=========================================');
    console.log('Demo Credentials:');
    console.log('Guest: guest@example.com / password');
    console.log('Host:  host@example.com / password');
    console.log('Admin: admin@example.com / password');
    console.log('=========================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding Nepali database:', error);
    process.exit(1);
  }
};

seedData();

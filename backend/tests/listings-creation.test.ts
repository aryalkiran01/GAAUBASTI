export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { validationResult } = require('express-validator');
const { validateListing } = require('../middlewares/validation');
const { createListing, sanitizeListingPayloadForCreate } = require('../controllers/listingController');
const User = require('../models/User');
const Listing = require('../models/Listing');

test('validateListing: accepts valid listing payload with object location', async () => {
  const req = {
    body: {
      title: 'Peaceful Mountain Homestay',
      description: 'A traditional homestay nestled in the Annapurna foothills with farm fresh food.',
      location: {
        address: 'Ward 5, Ghandruk',
        city: 'Ghandruk',
        district: 'Kaski',
        province: 'Gandaki',
      },
      price: 2500,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      category: 'homestay',
      amenities: ['WiFi', 'Hot Water'],
      images: [
        { url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa' },
      ],
    },
  };

  for (const middleware of validateListing) {
    await new Promise((resolve) => {
      const res = {
        status: () => res,
        json: () => resolve(),
      };
      middleware(req, res, resolve);
    });
  }

  const errors = validationResult(req);
  assert.equal(errors.isEmpty(), true);
});

test('validateListing: accepts listing with string URL images and string location', async () => {
  const req = {
    body: {
      title: 'Bandipur Heritage Cottage',
      description: 'Stunning Newari architecture with panoramic Himalayan views in Bandipur bazaar.',
      location: 'Bandipur, Tanahun',
      price: 3200,
      maxGuests: 3,
      images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa'],
    },
  };

  for (const middleware of validateListing) {
    await new Promise((resolve) => {
      const res = {
        status: () => res,
        json: () => resolve(),
      };
      middleware(req, res, resolve);
    });
  }

  const errors = validationResult(req);
  assert.equal(errors.isEmpty(), true);
});

test('validateListing: rejects invalid listing data (short title/description, negative price, zero guests)', async () => {
  const req = {
    body: {
      title: 'Bad',
      description: 'Too short',
      location: '',
      price: -100,
      maxGuests: 0,
    },
  };

  for (const middleware of validateListing) {
    await new Promise((resolve) => {
      const res = {
        status: () => res,
        json: () => resolve(),
      };
      middleware(req, res, resolve);
    });
  }

  const errors = validationResult(req);
  assert.equal(errors.isEmpty(), false);
  const paths = errors.array().map((e: any) => e.path);
  assert.ok(paths.includes('title'));
  assert.ok(paths.includes('description'));
  assert.ok(paths.includes('location'));
  assert.ok(paths.includes('price'));
  assert.ok(paths.includes('maxGuests'));
});

test('sanitizeListingPayloadForCreate: sanitizes strings and safety payload accurately', () => {
  const payload = {
    title: 'Himalayan Eco Homestay',
    description: 'Experience organic farming, mountain views, and genuine village hospitality.',
    location: 'Sirubari, Syangja',
    price: 1800,
    maxGuests: 4,
    safetyInfo: {
      emergencyContactName: 'Didi',
      emergencyContactPhone: '+977-9800000000',
      nearbyHospital: 'Sirubari Health Post',
      safetyNotes: 'Solar lighting installed.',
    },
  };

  const sanitized = sanitizeListingPayloadForCreate(payload);
  assert.equal(sanitized.title, 'Himalayan Eco Homestay');
  assert.equal(typeof sanitized.location, 'object');
  assert.equal(sanitized.location.city, 'Sirubari');
  assert.equal(sanitized.location.district, 'Syangja');
  assert.deepEqual(sanitized.safetyAndEmergency.safetyNotes, ['Solar lighting installed.']);
});

test('createListing: successfully creates listing in MongoDB with host association', async () => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    const hostUser = await User.create({
      name: 'Host User',
      username: 'hostusercreate',
      email: 'hostcreate@example.com',
      password: 'password123',
      role: 'host',
      isVerified: true,
    });

    const req: any = {
      user: hostUser,
      body: {
        title: 'Annapurna View Gurung Homestay',
        description: 'Wake up to the golden sunrise over Machhapuchhre in this stone-roofed homestay.',
        location: {
          address: 'Upper Ghandruk',
          city: 'Ghandruk',
          village: 'Ghandruk',
          district: 'Kaski',
          province: 'Gandaki',
          country: 'Nepal',
        },
        price: 2500,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        category: 'homestay',
        amenities: ['WiFi', 'Hot Water'],
        images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa'],
      },
    };

    let responseData: any = null;
    let statusCode = 200;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return res;
      },
    };

    await createListing(req, res);

    assert.equal(statusCode, 201);
    assert.equal(responseData.success, true);
    assert.equal(responseData.data.listing.title, 'Annapurna View Gurung Homestay');
    assert.equal(responseData.data.listing.price, 2500);
    assert.equal(responseData.data.listing.maxGuests, 4);
    assert.equal(responseData.data.listing.images.length, 1);
    assert.equal(responseData.data.listing.images[0].url, 'https://images.unsplash.com/photo-1544735716-392fe2489ffa');
    assert.equal(responseData.data.listing.host._id.toString(), hostUser._id.toString());
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
});

test('createListing: successfully creates listing with full wizard payload (houseRules, safety, geoJSON, image objects)', async () => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    const hostUser = await User.create({
      name: 'Wizard Host',
      username: 'wizardhost',
      email: 'wizardhost@example.com',
      password: 'password123',
      role: 'host',
      isVerified: true,
    });

    const req: any = {
      user: hostUser,
      body: {
        title: 'Complete Wizard Himalayan Homestay',
        description: 'Authentic stone homestay with traditional food, breathtaking Annapurna views and guided treks.',
        category: 'homestay',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        price: 3500,
        amenities: ['WiFi', 'Hot Water', 'Organic Meals'],
        houseRules: ['No smoking inside bedrooms', 'Quiet hours after 10 PM'],
        images: [
          { url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa', caption: 'Front facade' },
        ],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'moderate',
        safetyAndEmergency: {
          emergencyContactName: 'Village Lead',
          emergencyContactPhone: '+977-9800000000',
          nearbyHospital: 'Community Health Post',
          policeStationContact: '100',
          safetyNotes: ['Flashlight recommended for evenings'],
          importantLocationNotes: 'Stone staircase from main jeep stop',
        },
        location: {
          address: 'Upper Ward 3',
          city: 'Ghandruk',
          village: 'Ghandruk',
          district: 'Kaski',
          province: 'Gandaki',
          country: 'Nepal',
          coordinates: { latitude: 28.3758, longitude: 83.8083 },
          geoJSON: {
            type: 'Point',
            coordinates: [83.8083, 28.3758],
          },
        },
      },
    };

    let responseData: any = null;
    let statusCode = 200;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return res;
      },
    };

    await createListing(req, res);

    assert.equal(statusCode, 201);
    assert.equal(responseData.success, true);
    assert.equal(responseData.data.listing.title, 'Complete Wizard Himalayan Homestay');
    assert.equal(responseData.data.listing.houseRules.length, 2);
    assert.equal(responseData.data.listing.amenities.length, 3);
    assert.equal(responseData.data.listing.safetyAndEmergency.emergencyContactName, 'Village Lead');
    assert.equal(responseData.data.listing.location.city, 'Ghandruk');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
});

test('handleValidationErrors: formats clear error messages listing invalid fields', async () => {
  const { handleValidationErrors } = require('../middlewares/validation');

  const req = {
    body: {
      title: 'Hi',
      description: 'Too short',
      price: -10,
    },
  };

  // Run through validation rules
  for (const middleware of validateListing) {
    if (middleware === handleValidationErrors) continue;
    await new Promise((resolve) => {
      const res = { status: () => res, json: () => resolve() };
      middleware(req, res, resolve);
    });
  }

  let statusCode = 200;
  let responseData: any = null;
  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      return res;
    },
  };

  let nextCalled = false;
  handleValidationErrors(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 400);
  assert.equal(responseData.success, false);
  assert.ok(responseData.message.startsWith('Validation failed:'));
  assert.ok(responseData.message.includes('title'));
  assert.ok(responseData.message.includes('description'));
  assert.ok(Array.isArray(responseData.errors));
});

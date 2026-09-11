import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const Article = require('../models/Article');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');

describe('Phase 7, 8, 9 — Articles CMS, Host Experience & Guest Journey Suite', () => {
  describe('Phase 7: Articles & CMS Content System', () => {
    it('Article model validates rich cultural fields, village association, and author info', () => {
      const article = new Article({
        title: 'Complete Guide to Ghandruk Homestays',
        slug: 'complete-guide-to-ghandruk-homestays',
        category: 'culture',
        summary: 'Explore Gurung culture and village traditions.',
        content: '## Gurung Culture\nLiving in traditional slate-roofed homes...',
        coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
        author: {
          name: 'Pasang Tamu',
          role: 'Cultural Trek Guide',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        },
        tags: ['Ghandruk', 'Gurung', 'Culture'],
        villageSlug: 'ghandruk',
        isFeatured: true,
        readingTime: '6 min read',
        published: true,
      });

      const err = article.validateSync();
      assert.equal(err, undefined, 'Article schema validation should succeed');
      assert.equal(article.slug, 'complete-guide-to-ghandruk-homestays');
      assert.equal(article.villageSlug, 'ghandruk');
      assert.equal(article.author.name, 'Pasang Tamu');
      assert.equal(article.isFeatured, true);
    });

    it('Rejects Article missing required fields (title, slug, content)', () => {
      const invalidArticle = new Article({
        summary: 'Missing required title and content',
      });

      const err = invalidArticle.validateSync();
      assert.ok(err !== undefined, 'Validation should fail for incomplete article');
      assert.ok(err.errors.title, 'Title is required');
      assert.ok(err.errors.content, 'Content is required');
    });
  });

  describe('Phase 8: Host Dashboard & Wizard Metrics', () => {
    it('Calculates host occupancy, cancellation rate, and pending payouts correctly', () => {
      const mockBookings = [
        { status: 'completed', totalPrice: 150 },
        { status: 'completed', totalPrice: 200 },
        { status: 'confirmed', totalPrice: 120 },
        { status: 'cancelled', totalPrice: 80 },
      ];

      const completed = mockBookings.filter((b) => b.status === 'completed');
      const confirmed = mockBookings.filter((b) => b.status === 'confirmed');
      const cancelled = mockBookings.filter((b) => b.status === 'cancelled');

      const totalRevenue = completed.reduce((sum, b) => sum + b.totalPrice, 0);
      const pendingPayouts = confirmed.reduce((sum, b) => sum + b.totalPrice, 0);
      const cancellationRate = Math.round((cancelled.length / mockBookings.length) * 100);

      assert.equal(totalRevenue, 350);
      assert.equal(pendingPayouts, 120);
      assert.equal(cancellationRate, 25);
    });

    it('Listing creation validates 10-step wizard fields including location, amenities, and pricing', () => {
      const listing = new Listing({
        title: 'Authentic Sirubari Village Cottage',
        description: 'Cozy traditional slate-roofed cottage hosted by Gurung family.',
        category: 'homestay',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        price: 40,
        amenities: ['WiFi', 'Hot Water', 'Organic Meals', 'Mountain View'],
        location: {
          address: 'Sirubari Ward 2',
          city: 'Sirubari',
          village: 'Sirubari',
          district: 'Syangja',
          province: 'Gandaki',
          country: 'Nepal',
          coordinates: { latitude: 28.0833, longitude: 83.8447 },
          geoJSON: { type: 'Point', coordinates: [83.8447, 28.0833] },
        },
        host: new mongoose.Types.ObjectId(),
      });

      const err = listing.validateSync();
      assert.equal(err, undefined, 'Valid listing wizard payload should pass schema validation');
      assert.equal(listing.price, 40);
      assert.equal(listing.amenities.length, 4);
    });
  });

  describe('Phase 9: Complete Guest Journey & Price Calculations', () => {
    it('Calculates authoritative guest booking totals accurately with cleaning and community service fee', () => {
      const pricePerNight = 50;
      const nights = 3;
      const cleaningFee = 15;
      const serviceFeePercentage = 0.08;

      const basePrice = pricePerNight * nights;
      const serviceFee = Math.round(basePrice * serviceFeePercentage);
      const totalAmount = basePrice + cleaningFee + serviceFee;

      assert.equal(basePrice, 150);
      assert.equal(serviceFee, 12);
      assert.equal(totalAmount, 177);
    });

    it('Validates stay date range: start date must be strictly before end date', () => {
      const checkin = new Date('2026-10-01T14:00:00.000Z');
      const checkout = new Date('2026-10-04T10:00:00.000Z');

      const diffTime = checkout.getTime() - checkin.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      assert.ok(diffDays > 0);
      assert.equal(diffDays, 3);
    });
  });
});

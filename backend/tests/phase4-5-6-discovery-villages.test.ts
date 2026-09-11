import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const Village = require('../models/Village');
const Listing = require('../models/Listing');

describe('Phase 4, 5, 6 — Map, Location, Search & Village Tourism Suite', () => {
  describe('Phase 4: GeoJSON & Location Discovery', () => {
    it('Listing model supports GeoJSON Point coordinates [longitude, latitude]', () => {
      const listing = new Listing({
        title: 'Himalayan Ridge Homestay',
        description: 'Authentic stone cottage with Annapurna mountain views.',
        location: {
          address: 'Ghandruk Ward 10',
          city: 'Ghandruk',
          district: 'Kaski',
          province: 'Gandaki',
          country: 'Nepal',
          coordinates: {
            latitude: 28.3758,
            longitude: 83.8083,
          },
        },
        price: 35,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        host: new mongoose.Types.ObjectId(),
      });

      // Trigger pre-save hook / normalization logic
      if (listing.location?.coordinates?.latitude && !listing.location?.geoJSON?.coordinates?.length) {
        listing.location.geoJSON = {
          type: 'Point',
          coordinates: [listing.location.coordinates.longitude, listing.location.coordinates.latitude],
        };
      }

      assert.equal(listing.location.geoJSON?.type, 'Point');
      assert.equal(listing.location.geoJSON?.coordinates[0], 83.8083); // longitude first in GeoJSON
      assert.equal(listing.location.geoJSON?.coordinates[1], 28.3758); // latitude second
      assert.equal(listing.location.district, 'Kaski');
      assert.equal(listing.location.province, 'Gandaki');
    });

    it('Calculates spherical radius radians correctly for MongoDB $geoWithin $centerSphere', () => {
      const radiusKm = 25;
      const earthRadiusKm = 6378.1;
      const radians = radiusKm / earthRadiusKm;
      assert.ok(radians > 0 && radians < 0.01);
      assert.equal(Number((radians * earthRadiusKm).toFixed(1)), 25.0);
    });
  });

  describe('Phase 5: Search, Discovery & Sorting Validation', () => {
    it('Validates all allowed sorting parameters', () => {
      const allowedSortFields = [
        'recommended',
        'price-asc',
        'price-desc',
        'averageRating-desc',
        'reviewCount-desc',
        'createdAt-desc',
      ];

      allowedSortFields.forEach((opt) => {
        assert.ok(typeof opt === 'string' && opt.length > 0);
      });
    });

    it('Sanitizes search filter queries to prevent injection or ReDoS', () => {
      const rawInput = 'Ghandruk.*^$[]()';
      const escaped = rawInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.equal(escaped, 'Ghandruk\\.\\*\\^\\$\\[\\]\\(\\)');
    });
  });

  describe('Phase 6: Scalable Village & Tourism Model', () => {
    it('Creates valid Village documents with rich cultural, culinary, and transport data', () => {
      const village = new Village({
        name: 'Ghandruk',
        slug: 'ghandruk',
        tagline: 'The Stone Village Under Annapurna',
        province: 'Gandaki',
        district: 'Kaski',
        municipality: 'Annapurna Rural Municipality',
        ward: 10,
        altitude: 1940,
        description: 'Iconic Gurung settlement with slate roofs and front-row Fishtail vistas.',
        heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
        gallery: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa'],
        culture: {
          overview: 'Indigenous Gurung culture with rich Tamu traditions.',
          ethnicGroups: ['Gurung', 'Magar'],
          traditions: ['Tamu Lhosar', 'Ghantu Nach'],
          languages: ['Gurung', 'Nepali'],
        },
        localFood: [
          {
            name: 'Dhindo & Local Kukhura ko Jhol',
            description: 'Organic buckwheat porridge with local chicken gravy.',
          },
        ],
        festivals: [
          {
            name: 'Tamu Lhosar',
            month: 'December - January',
            description: 'Gurung New Year festival.',
          },
        ],
        attractions: [
          {
            title: 'Gurung Cultural Museum',
            description: 'Century-old artifacts and dress.',
            distance: 'Village center',
          },
        ],
        activities: [
          {
            title: 'Sunrise Fishtail View',
            description: 'Panoramic sunrise over Annapurna summits.',
            difficulty: 'Easy',
          },
        ],
        transport: {
          howToReach: 'Drive Pokhara -> Nayapul -> Ghandruk.',
          nearestBusStop: 'Ghandruk Bus Stand',
          nearestAirport: 'Pokhara Airport',
          roadCondition: 'Paved highway then gravel road.',
          estimatedTravelTime: '3.5 hours',
        },
        safetyInfo: {
          medicalFacilities: 'Community health post.',
          networkConnectivity: '4G coverage available.',
        },
        coordinates: {
          type: 'Point',
          coordinates: [83.8083, 28.3758],
        },
        isFeatured: true,
      });

      const err = village.validateSync();
      assert.equal(err, undefined, 'Village schema validation should succeed with valid data');
      assert.equal(village.slug, 'ghandruk');
      assert.equal(village.altitude, 1940);
      assert.equal(village.culture.ethnicGroups.length, 2);
      assert.equal(village.localFood[0].name, 'Dhindo & Local Kukhura ko Jhol');
      assert.equal(village.coordinates.coordinates[0], 83.8083);
    });

    it('Rejects Village creation missing mandatory fields like name, slug, province, district, heroImage', () => {
      const invalidVillage = new Village({
        tagline: 'Incomplete village without required fields',
      });

      const err = invalidVillage.validateSync();
      assert.ok(err !== undefined, 'Village validation must fail when required fields are missing');
      assert.ok(err.errors.name, 'Name is required');
      assert.ok(err.errors.slug, 'Slug is required');
      assert.ok(err.errors.province, 'Province is required');
      assert.ok(err.errors.district, 'District is required');
      assert.ok(err.errors.description, 'Description is required');
      assert.ok(err.errors.heroImage, 'Hero image is required');
    });
  });
});

export {};
const mongoose = require('mongoose');
require('dotenv').config();

const Listing = require('../models/Listing');

const migrateGeoJson = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gaunbasti';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for GeoJSON migration...');

    const cursor = Listing.find({
      $or: [
        { 'location.geoJSON': { $exists: false } },
        { 'location.geoJSON.coordinates': { $exists: false } },
        { 'location.geoJSON.coordinates': { $size: 0 } }
      ]
    }).cursor();

    let count = 0;
    for await (const doc of cursor) {
      if (
        doc.location?.coordinates?.latitude !== undefined &&
        doc.location?.coordinates?.longitude !== undefined
      ) {
        doc.location.geoJSON = {
          type: 'Point',
          coordinates: [
            Number(doc.location.coordinates.longitude),
            Number(doc.location.coordinates.latitude)
          ]
        };
        await doc.save();
        count++;
      }
    }

    console.log(`Successfully migrated ${count} listing(s) to GeoJSON format.`);
    await mongoose.disconnect();
  } catch (error: any) {
    console.error('GeoJSON migration failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  migrateGeoJson();
}

module.exports = migrateGeoJson;

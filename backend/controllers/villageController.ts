export {};
const Village = require('../models/Village');
const Listing = require('../models/Listing');

const escapeRegex = (str: string) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getVillages = async (req: any, res: any) => {
  try {
    const { province, district, search, isFeatured, page = 1, limit = 12 } = req.query;

    const filter: any = { isActive: true };

    if (province) {
      filter.province = { $regex: new RegExp(`^${escapeRegex(province)}$`, 'i') };
    }

    if (district) {
      filter.district = { $regex: new RegExp(`^${escapeRegex(district)}$`, 'i') };
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    if (search) {
      const escaped = escapeRegex(search);
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { tagline: { $regex: escaped, $options: 'i' } },
        { district: { $regex: escaped, $options: 'i' } },
        { province: { $regex: escaped, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [villages, total] = await Promise.all([
      Village.find(filter)
        .select('name slug province district municipality altitude tagline heroImage isFeatured')
        .sort({ isFeatured: -1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Village.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        villages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalVillages: total,
          hasNextPage: skip + villages.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch villages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getFeaturedVillages = async (req: any, res: any) => {
  try {
    const villages = await Village.find({ isActive: true, isFeatured: true })
      .select('name slug province district municipality altitude tagline heroImage')
      .limit(6);

    res.json({
      success: true,
      data: { villages }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured villages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getVillageBySlug = async (req: any, res: any) => {
  try {
    const { slug } = req.params;
    const village = await Village.findOne({ slug: slug.toLowerCase(), isActive: true });

    if (!village) {
      return res.status(404).json({
        success: false,
        message: 'Village not found'
      });
    }

    // Find homestays and stays in this village or nearby within 15km
    let nearbyListings = await Listing.find({
      isActive: true,
      isVerified: true,
      $or: [
        { 'location.village': { $regex: new RegExp(`^${escapeRegex(village.name)}$`, 'i') } },
        { 'location.city': { $regex: new RegExp(`^${escapeRegex(village.name)}$`, 'i') } },
        { 'location.district': { $regex: new RegExp(`^${escapeRegex(village.district)}$`, 'i') } }
      ]
    })
      .populate('host', 'name avatar hostProfile.responseRate')
      .limit(8);

    // If no direct name matches, query geo near if coordinates available
    if (nearbyListings.length === 0 && village.coordinates?.coordinates?.length === 2) {
      const [lng, lat] = village.coordinates.coordinates;
      nearbyListings = await Listing.find({
        isActive: true,
        isVerified: true,
        'location.geoJSON': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: 25000 // 25km
          }
        }
      })
        .populate('host', 'name avatar hostProfile.responseRate')
        .limit(8);
    }

    res.json({
      success: true,
      data: {
        village,
        listings: nearbyListings
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch village details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createVillage = async (req: any, res: any) => {
  try {
    const village = new Village(req.body);
    await village.save();

    res.status(201).json({
      success: true,
      message: 'Village created successfully',
      data: { village }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create village',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateVillage = async (req: any, res: any) => {
  try {
    const village = await Village.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!village) {
      return res.status(404).json({ success: false, message: 'Village not found' });
    }

    res.json({
      success: true,
      message: 'Village updated successfully',
      data: { village }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update village',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteVillage = async (req: any, res: any) => {
  try {
    const village = await Village.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!village) {
      return res.status(404).json({ success: false, message: 'Village not found' });
    }

    res.json({
      success: true,
      message: 'Village deactivated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete village',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const villageController = {
  getVillages,
  getFeaturedVillages,
  getVillageBySlug,
  createVillage,
  updateVillage,
  deleteVillage
};

module.exports = villageController;
module.exports.default = villageController;
export default villageController;

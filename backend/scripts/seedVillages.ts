export {};
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const Village = require('../models/Village');
const Listing = require('../models/Listing');

if (process.env.NODE_ENV === 'production') {
  console.error('FATAL: seedVillages cannot be executed in production environment!');
  process.exit(1);
}

const VILLAGES_DATA = [
  {
    name: 'Ghandruk',
    slug: 'ghandruk',
    tagline: 'The Stone Village Under Annapurna',
    province: 'Gandaki',
    district: 'Kaski',
    municipality: 'Annapurna Rural Municipality',
    ward: 10,
    altitude: 1940,
    description: `Ghandruk is a world-renowned picturesque Gurung settlement nestled in the lap of the Annapurna mountain range. Famous for its traditional slate-roofed stone houses, cobbled pathways, and front-row panoramic vistas of Annapurna South, Hiunchuli, and Machhapuchhre (Fishtail).

The village serves as a shining model for community-based rural tourism in Nepal, where visitors are warmly welcomed into traditional Gurung homes with customary marigold garlands, white khadas, and authentic Himalayan hospitality.`,
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    ],
    culture: {
      overview: 'Ghandruk is predominantly inhabited by the indigenous Gurung (Tamu) people, celebrated for their martial valor, rich shamanistic traditions (Bon and Buddhism), and vibrant festive dances.',
      ethnicGroups: ['Gurung', 'Tamu', 'Magar', 'Bishwakarma'],
      traditions: ['Tamu Lhosar', 'Rodhi gathering songs', 'Ghantu dance', 'Sorathi folk performance'],
      languages: ['Gurung', 'Nepali', 'English'],
    },
    localFood: [
      {
        name: 'Dhindo & Local Kukhura ko Jhol',
        description: 'Traditional buckwheat/millet porridge served with free-range local chicken gravy and wild Timur pickle.',
      },
      {
        name: 'Gundruk Sadeko',
        description: 'Fermented leafy sundried greens tossed with mustard oil, roasted cumin, green chilies, and lemon juice.',
      },
      {
        name: 'Local Kodo ko Chhyang',
        description: 'Mildly fermented organic millet brew traditionally served during community gatherings.',
      },
    ],
    festivals: [
      {
        name: 'Tamu Lhosar',
        month: 'December - January',
        description: 'The Gurung New Year celebrated with traditional costume parades, archer competitions, and feasting.',
      },
      {
        name: 'Ghantu Nach',
        month: 'April - May (Chandi Purnima)',
        description: 'Ancient narrative dance drama performed by young girls in trance depicting historic Gurung royalty.',
      },
    ],
    attractions: [
      {
        title: 'Gurung Cultural Museum',
        description: 'Showcases centuries-old domestic artifacts, traditional weaponry, musical instruments, and woven attire.',
        distance: 'Within village center',
      },
      {
        title: 'Poon Hill Trail Junction',
        description: 'Gateway to panoramic rhododendron forest trekking routes toward Ghorepani and Poon Hill.',
        distance: '1 hour hike from village',
      },
    ],
    activities: [
      {
        title: 'Sunrise View of Fishtail & Annapurna South',
        description: 'Witness the morning golden alpenglow over high Himalayan summits from your homestay balcony.',
        difficulty: 'Easy',
      },
      {
        title: 'Traditional Gurung Costume Photography',
        description: 'Dress up in authentic Ghalek, velvet blouse, lungi, and traditional jewelry for cultural memories.',
        difficulty: 'Easy',
      },
    ],
    transport: {
      howToReach: 'Drive from Pokhara to Nayapul (1.5 hrs via Baglung Highway), then take a 4WD shared jeep or local bus directly to Ghandruk village bus stand (approx 2 hrs scenic drive).',
      nearestBusStop: 'Ghandruk Jeep Station',
      nearestAirport: 'Pokhara International Airport (PKR) - 48 km',
      roadCondition: 'Paved highway till Birethanti; scenic gravel mountain road thereafter.',
      estimatedTravelTime: '3.5 to 4 hours from Pokhara',
    },
    bestTimeToVisit: ['September - November (Autumn)', 'March - May (Spring Bloom)'],
    safetyInfo: {
      medicalFacilities: 'Ghandruk Community Health Post & Local Pharmacy with basic primary care.',
      networkConnectivity: 'Good 4G mobile coverage (NTC / Ncell); High-speed Wi-Fi available across homestays.',
      emergencyContacts: ['Annapurna Conservation Area Project (ACAP) Help Desk', 'Local Police Station: 100'],
      generalTips: ['Carry ACAP entry permit if continuing beyond village into conservation trekking routes.'],
    },
    coordinates: {
      type: 'Point',
      coordinates: [83.8083, 28.3758], // [lng, lat]
    },
    isFeatured: true,
    featuredRank: 1,
    homestayCount: 18,
  },
  {
    name: 'Bandipur',
    slug: 'bandipur',
    tagline: 'The Living Museum of Newari Architecture',
    province: 'Gandaki',
    district: 'Tanahun',
    municipality: 'Bandipur Rural Municipality',
    ward: 4,
    altitude: 1030,
    description: `Bandipur is a beautifully preserved hilltop Newari town that retains its 18th-century architecture, slate-paved vehicular-free main bazaar, and commanding panoramic views of the Dhaulagiri, Annapurna, and Manaslu ranges.

Originally an important trading stop on the historic India-Tibet merchant route, Bandipur has transformed into one of Nepal's most charming heritage tourism destinations without losing its tranquil rhythm.`,
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    ],
    culture: {
      overview: 'Refined Newari culture blended with Magar hilltop heritage. Known for intricate wood carving, stone-paved courtyards, and community festivals.',
      ethnicGroups: ['Newar', 'Magar', 'Gurung', 'Chhetri'],
      traditions: ['Bisket Jatra', 'Gai Jatra', 'Lakhey Dance'],
      languages: ['Newari (Nepal Bhasa)', 'Nepali', 'English'],
    },
    localFood: [
      {
        name: 'Newari Samay Baji',
        description: 'Ceremonial platter with beaten rice (Baji), spicy smoked buffalo/mutton meat (Choila), roasted soybeans (Bhatmas), and ginger-garlic salad.',
      },
      {
        name: 'Yomari & Bara',
        description: 'Steamed rice flour dumplings stuffed with chaku/molasses and savory lentil patties.',
      },
    ],
    festivals: [
      {
        name: 'Bisket Jatra of Bandipur',
        month: 'April (Nepali New Year)',
        description: 'Chariot pulling and holy pole erection celebrating the renewal of life and prosperity.',
      },
    ],
    attractions: [
      {
        name: 'Siddha Gufa (Siddha Cave)',
        description: 'The largest natural limestone cave in Nepal, with a 50m ceiling and stunning stalactites.',
        distance: '1.5 hours downhill hike',
      },
      {
        name: 'Thani Mai Temple (Gurungche Hill)',
        description: 'A hilltop viewpoint offering 360-degree vistas and breathtaking sunrise over the clouds.',
        distance: '30 mins morning climb',
      },
    ],
    activities: [
      {
        title: 'Heritage Bazaar Evening Walk',
        description: 'Stroll along the historic car-free stone promenade lined with European-style cafes and restored Newari mansions.',
        difficulty: 'Easy',
      },
    ],
    transport: {
      howToReach: 'Located just 8 km uphill from Dumre on the Prithvi Highway between Kathmandu and Pokhara. Easily accessible by private car, taxi, or local bus from Dumre.',
      nearestBusStop: 'Bandipur Main Gate Station',
      nearestAirport: 'Pokhara International Airport (75 km)',
      roadCondition: 'Fully blacktopped smooth winding hill road from Dumre to Bandipur.',
      estimatedTravelTime: '4 hours from Kathmandu, 2 hours from Pokhara',
    },
    bestTimeToVisit: ['Year-round destination; Best October - April'],
    safetyInfo: {
      medicalFacilities: 'Bandipur Hospital with 24-hour emergency services.',
      networkConnectivity: 'Excellent 4G across all networks; Fast fiber internet available.',
      emergencyContacts: ['Bandipur Police Station', 'Tourist Information Bureau'],
    },
    coordinates: {
      type: 'Point',
      coordinates: [84.4172, 27.9317], // [lng, lat]
    },
    isFeatured: true,
    featuredRank: 2,
    homestayCount: 14,
  },
  {
    name: 'Sirubari',
    slug: 'sirubari',
    tagline: 'Pioneer of Community Village Tourism in Nepal',
    province: 'Gandaki',
    district: 'Syangja',
    municipality: 'Aandhikhola Rural Municipality',
    ward: 1,
    altitude: 1700,
    description: `Sirubari is Nepal's very first model community homestay village, winning the prestigious PATA Gold Award for eco-tourism. Situated on the southern slopes of Syangja district, the village is exceptionally clean, vehicle-free inside the settlement, and paved entirely with slate.

Guests are formally assigned host families on a rotational basis ensuring fair economic benefit across the whole village. Every visitor is treated as a revered family member (Pahuna).`,
    heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    ],
    culture: {
      overview: 'Gurung cultural stronghold where ancient traditions, community cleanliness, and mutual aid (Parma) are actively practiced daily.',
      ethnicGroups: ['Gurung', 'Brahmin', 'Chhetri'],
      traditions: ['Formal welcome garland ceremony', 'Evening cultural Rodhi songs', 'Organic farming'],
      languages: ['Nepali', 'Gurung'],
    },
    localFood: [
      {
        name: 'Millet Roti & Fresh Ghee',
        description: 'Hand-pressed organic finger millet flatbread served with fresh homemade buffalo butter and timur chutney.',
      },
    ],
    festivals: [
      {
        name: 'Tamu Lhosar & Maghe Sankranti',
        month: 'January',
        description: 'Community feasts with wild yam, sweet potatoes, and traditional song contests.',
      },
    ],
    attractions: [
      {
        name: 'Dahare Hilltop Viewpoint',
        description: 'Highest point in the region (2,300m) with sweeping views from Dhaulagiri in the west to Manaslu in the east.',
        distance: '2 hours forest hike',
      },
    ],
    activities: [
      {
        title: 'Participate in Organic Village Farming',
        description: 'Join your host family in milking cows, harvesting organic seasonal crops, and preparing organic meals.',
        difficulty: 'Easy',
      },
    ],
    transport: {
      howToReach: 'Drive from Pokhara to Naudanda on Siddhartha Highway, then follow the scenic mountain road via Karkineta to Sirubari.',
      nearestBusStop: 'Sirubari Village Entrance Gate',
      nearestAirport: 'Pokhara Airport - 38 km',
      roadCondition: 'Paved highway followed by gravel hill road; 4WD recommended during monsoon.',
      estimatedTravelTime: '2.5 to 3 hours from Pokhara',
    },
    bestTimeToVisit: ['September - May'],
    safetyInfo: {
      medicalFacilities: 'Sub-health post with emergency first-aid.',
      networkConnectivity: 'Stable mobile reception and home Wi-Fi.',
      emergencyContacts: ['Sirubari Tourism Development Committee'],
    },
    coordinates: {
      type: 'Point',
      coordinates: [83.8447, 28.0833], // [lng, lat]
    },
    isFeatured: true,
    featuredRank: 3,
    homestayCount: 12,
  },
  {
    name: 'Helambu',
    slug: 'helambu',
    tagline: 'The Sacred Hidden Valley of Hyolmo Culture',
    province: 'Bagmati',
    district: 'Sindhupalchok',
    municipality: 'Helambu Rural Municipality',
    ward: 2,
    altitude: 2600,
    description: `Helambu (Hyolmo) is an enchanting highland valley located just north of Kathmandu, celebrated for its crisp alpine air, ancient Buddhist monasteries, sweet organic apple orchards, and distinctive Hyolmo indigenous culture.

Often known as 'Beyul'—a sacred hidden sanctuary blessed by Guru Padmasambhava—the valley is a spiritual haven surrounded by towering snow-clad peaks of the Langtang Himal range.`,
    heroImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    ],
    culture: {
      overview: 'Rich Hyolmo Tibetan-Buddhist culture. Prayer flags (Lungta) flutter across every house, mani walls line the paths, and ancient butter lamps illuminate century-old gompas.',
      ethnicGroups: ['Hyolmo', 'Tamang', 'Sherpa'],
      traditions: ['Sonam Lhosar', 'Butter sculpture making', 'Mani rimdu prayers'],
      languages: ['Hyolmo', 'Tamang', 'Nepali'],
    },
    localFood: [
      {
        name: 'Yak Cheese & Butter Tea (Su-Chya)',
        description: 'Fresh Himalayan yak cheese paired with savory whipped churned butter tea seasoned with Himalayan rock salt.',
      },
      {
        name: 'Helambu Apple Cider & Shyaphale',
        description: 'Freshly pressed organic apple juice alongside deep-fried golden pastry pockets stuffed with minced seasoned vegetables.',
      },
    ],
    festivals: [
      {
        name: 'Sonam Lhosar & Gyalpo Lhosar',
        month: 'January - February',
        description: 'Monastery masked Cham dances, ritual incense ceremonies, and community butter tea feasts.',
      },
    ],
    attractions: [
      {
        name: 'Melamchighyang Gompa & Guru Rinpoche Cave',
        description: 'Ancient sacred meditation cave and peaceful monastery overlooking the valley.',
        distance: 'In Melamchighyang settlement',
      },
    ],
    activities: [
      {
        title: 'Helambu Great Himalayan Trail Walk',
        description: 'Walk scenic ridge paths through rhododendron and pine forests with panoramic Langtang mountain vistas.',
        difficulty: 'Moderate',
      },
    ],
    transport: {
      howToReach: 'Drive from Kathmandu via Sundarijal (for trekking) or via Melamchi Bazaar through paved and jeep roads up to Sermathang and Tarkegyang.',
      nearestBusStop: 'Tarkegyang Bus Stand',
      nearestAirport: 'Tribhuvan International Airport (KTM) - 65 km',
      roadCondition: 'Blacktopped highway till Melamchi, seasonal mountain dirt road to high villages.',
      estimatedTravelTime: '4 to 5 hours from Kathmandu',
    },
    bestTimeToVisit: ['March - May', 'October - December'],
    safetyInfo: {
      medicalFacilities: 'Helambu Primary Healthcare Center.',
      networkConnectivity: '4G coverage available in main settlements.',
      emergencyContacts: ['Langtang National Park Protection Post'],
    },
    coordinates: {
      type: 'Point',
      coordinates: [85.5583, 28.0333], // [lng, lat]
    },
    isFeatured: true,
    featuredRank: 4,
    homestayCount: 10,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaunbasti');
    console.log(' Connected to MongoDB');

    for (const vData of VILLAGES_DATA) {
      const existing = await Village.findOne({ slug: vData.slug });
      if (existing) {
        await Village.updateOne({ slug: vData.slug }, vData);
        console.log(` Updated village: ${vData.name}`);
      } else {
        await Village.create(vData);
        console.log(` Created village: ${vData.name}`);
      }

      // Also ensure any listings matching this village name are assigned proper GeoJSON coordinates
      await Listing.updateMany(
        {
          $or: [
            { 'location.city': new RegExp(vData.name, 'i') },
            { 'location.address': new RegExp(vData.name, 'i') },
            { 'location.village': new RegExp(vData.name, 'i') },
          ],
        },
        {
          $set: {
            'location.village': vData.name,
            'location.district': vData.district,
            'location.province': vData.province,
            'location.geoJSON': vData.coordinates,
            'location.coordinates': {
              latitude: vData.coordinates.coordinates[1],
              longitude: vData.coordinates.coordinates[0],
            },
          },
        }
      );
    }

    console.log(' Village seeding & listing synchronization complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(' Seeding error:', err);
    process.exit(1);
  }
}

seed();

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

export const VILLAGES_DATA = [
  {
    name: 'Ghandruk',
    slug: 'ghandruk',
    tagline: 'The Slate-Roofed Stone Village Under Annapurna',
    province: 'Gandaki',
    district: 'Kaski',
    municipality: 'Annapurna Rural Municipality',
    ward: 10,
    altitude: 1940,
    description: `Ghandruk (घान्द्रुक) is Nepal's crown jewel of community-managed rural tourism, nestled against the sheer southern face of the Annapurna Massif. Famous for its hand-chiseled slate houses, terraced millet fields, and uninterrupted panoramic views of Machhapuchhre (Fishtail, 6,993m), Hiunchuli, and Annapurna South.

Operated under the Ghandruk Community Homestay Management Committee (घान्द्रुक सामुदायिक होमस्टे व्यवस्थापन समिति) in partnership with the Annapurna Conservation Area Project (ACAP) and Gaun Basti Stays Hub, the village invites travelers to experience authentic Gurung hospitality, traditional hearth cooking, and ancestral mountain customs.`,
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    ],
    culture: {
      overview: 'Ghandruk is the spiritual and cultural heartland of the indigenous Gurung (Tamu) people, renowned worldwide as legendary Gurkha warriors and guardians of the Himalayan passes.',
      ethnicGroups: ['Gurung (Tamu)', 'Magar', 'Bishwakarma'],
      traditions: ['Tamu Lhosar Celebrations', 'Rodhi Ghar Singing', 'Ghantu & Sorathi Folk Dances', 'Bon Shamanistic Healing'],
      languages: ['Gurung (Tamu Kye)', 'Nepali', 'English'],
    },
    localFood: [
      {
        name: 'Kodo ko Dhindo & Local Kukhura ko Jhol',
        description: 'Stone-ground organic finger millet porridge served with free-range mountain rooster broth, wild Timur pickle, and fresh buffalo ghee.',
      },
      {
        name: 'Gundruk & Bhatmas ko Jhol',
        description: 'Naturally fermented and sun-dried mustard greens simmered with roasted soybeans and Himalayan mountain garlic.',
      },
      {
        name: 'Traditional Chhyang & Marpha Brandy',
        description: 'Mildly fermented local millet elixir served in traditional bronze bowls during cultural receptions.',
      },
    ],
    festivals: [
      {
        name: 'Tamu Lhosar (Gurung New Year)',
        month: 'Poush (December - January)',
        description: 'Vibrant cultural gala with traditional Ghalek attire parades, archery competitions, and family feasts.',
      },
      {
        name: 'Sati Ghantu Nach',
        month: 'Baisakh Purnima (April - May)',
        description: 'Centuries-old classical trance dance drama performed by unmarried maidens narrating the legends of historic Himalayan kings.',
      },
    ],
    attractions: [
      {
        title: 'Old Gurung Cultural Heritage Museum',
        description: 'Houses 200-year-old family heirlooms, traditional bamboo handicrafts, handloom textiles, and Gurkha ceremonial weaponry.',
        distance: 'Central Village Square',
      },
      {
        title: 'Machhapuchhre Viewpoint & Kot Danda',
        description: 'Prime sunrise overlook with 180-degree unobstructed vistas of sacred Mount Machhapuchhre.',
        distance: '15 min walk from Village Center',
      },
    ],
    activities: [
      {
        title: 'Sunrise Alpenglow Over Annapurna South',
        description: 'Watch the first morning rays illuminate 7,000m+ Himalayan peaks directly from your homestay stone balcony.',
        difficulty: 'Easy',
      },
      {
        title: 'Authentic Handloom & Nettle Weaving Workshop',
        description: 'Learn ancestral spinning and weaving techniques of wild Himalayan nettle (Allo) from village grandmothers.',
        difficulty: 'Easy',
      },
    ],
    transport: {
      howToReach: 'Drive from Pokhara to Nayapul (1.5 hrs via Baglung Highway), followed by a scenic 4WD mountain jeep ride through Birethanti up to Ghandruk Jeep Terminal.',
      nearestBusStop: 'Ghandruk Central Jeep Station',
      nearestAirport: 'Pokhara International Airport (PKR) - 48 km',
      roadCondition: 'Smooth blacktopped highway till Nayapul; all-weather gravel road up to the village.',
      estimatedTravelTime: '3.5 hours from Pokhara',
    },
    bestTimeToVisit: ['September - November (Clear Autumn Skies)', 'March - May (Rhododendron Bloom)'],
    safetyInfo: {
      medicalFacilities: 'Annapurna Rural Health Center & ACAP Emergency First Aid Post.',
      networkConnectivity: '4G coverage (Nepal Telecom / Ncell) with fiber Wi-Fi in certified homestays.',
      emergencyContacts: ['ACAP Ghandruk Checkpost', 'Kaski District Police: 100', 'Gaun Basti Emergency Support: +977-1-4400000'],
      generalTips: ['Carry ACAP permit if trekking beyond the village', 'Dress respectfully in village sacred areas.'],
    },
    coordinates: {
      type: 'Point',
      coordinates: [83.8083, 28.3758], // [lng, lat]
    },
    isFeatured: true,
    featuredRank: 1,
    homestayCount: 22,
  },
  {
    name: 'Bandipur',
    slug: 'bandipur',
    tagline: 'Living Heritage & 18th-Century Newari Mountain Architecture',
    province: 'Gandaki',
    district: 'Tanahun',
    municipality: 'Bandipur Rural Municipality',
    ward: 4,
    altitude: 1030,
    description: `Bandipur (बन्दीपुर) is a meticulously preserved hilltop sanctuary of classical Newari architecture and tranquil hilltop living. Originally established by Newar merchants from Bhaktapur along the historic Trans-Himalayan trade route, the town retains its slate-paved car-free main promenade, carved teak window overhangs (Aakhi Jhyal), and breezy neoclassical facades.

Regulated by the Bandipur Tourism Development Committee (बन्दीपुर पर्यटन विकास समिति) and Gaun Basti Stays Hub, motorized vehicles are strictly barred from the heritage bazaar, preserving its timeless European-mountain ambience.`,
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    ],
    culture: {
      overview: 'Harmonious blend of rich Bhaktapur-origin Newari merchant culture and traditional Tanahun Magar hill traditions.',
      ethnicGroups: ['Newar (Shrestha, Pradhan)', 'Magar', 'Gurung', 'Brahmin/Chhetri'],
      traditions: ['Bisket Jatra Chariot Procession', 'Lakhey Sacred Mask Dance', 'Gai Jatra Carnival'],
      languages: ['Nepal Bhasa (Newari)', 'Nepali', 'English'],
    },
    localFood: [
      {
        name: 'Authentic Newari Samay Baji Platter',
        description: 'Ceremonial assortment of beaten rice (Baji), roasted spiced buffalo meat (Choila), black soybeans (Bhatmas), ginger salad (Palu), and spiced boiled egg.',
      },
      {
        name: 'Freshly Steamed Yomari & Wo (Bara)',
        description: 'Rice flour sweet dumplings oozing with rich molasses (Chaku) paired with savory spiced lentil patties.',
      },
    ],
    festivals: [
      {
        name: 'Bandipur Bisket Jatra',
        month: 'Baisakh (Mid-April)',
        description: 'Grand New Year festival marked by pulling holy wooden chariots and erecting the sacred ceremonial pole (Lingo).',
      },
    ],
    attractions: [
      {
        title: 'Siddha Cave (सिद्ध गुफा)',
        description: 'The largest natural limestone cave in Nepal, soaring over 50 meters high with stunning stalactites and chambers.',
        distance: '1.5-hour downhill forest trail',
      },
      {
        title: 'Thani Mai Temple on Gurungche Hill',
        description: 'Holy shrine atop a peak offering 360-degree sunrise vistas spanning the Dhaulagiri, Annapurna, and Manaslu ranges.',
        distance: '30-minute stone staircase climb',
      },
    ],
    activities: [
      {
        title: 'Heritage Street Photography & Coffee Walk',
        description: 'Stroll the silent stone bazaar at dusk, admiring restored 18th-century woodcraft and vibrant street cafes.',
        difficulty: 'Easy',
      },
    ],
    transport: {
      howToReach: 'Located just 8 km uphill from Dumre along the Prithvi Highway (midway between Kathmandu and Pokhara). Microbuses, private tourist cabs, and local buses connect Dumre to Bandipur gate hourly.',
      nearestBusStop: 'Bandipur Main Entrance Station',
      nearestAirport: 'Pokhara International Airport - 75 km',
      roadCondition: 'Smooth, fully blacktopped two-lane winding scenic hill road.',
      estimatedTravelTime: '4 hours from Kathmandu, 2 hours from Pokhara',
    },
    bestTimeToVisit: ['October - April (Pleasant Mountain Sun)'],
    safetyInfo: {
      medicalFacilities: 'Bandipur Government Hospital (24-hour emergency ward).',
      networkConnectivity: 'High-speed 4G coverage and fiber broadband across all registered homestays.',
      emergencyContacts: ['Bandipur Area Police Post: +977-65-520100', 'Tanahun Tourist Helpdesk: 100'],
      generalTips: ['Motor vehicles are prohibited on the main heritage street.'],
    },
    coordinates: {
      type: 'Point',
      coordinates: [84.4172, 27.9317], // [lng, lat]
    },
    isFeatured: true,
    featuredRank: 2,
    homestayCount: 16,
  },
  {
    name: 'Sirubari',
    slug: 'sirubari',
    tagline: 'Nepal’s Pioneer PATA Gold Award Eco-Homestay Village',
    province: 'Gandaki',
    district: 'Syangja',
    municipality: 'Aandhikhola Rural Municipality',
    ward: 1,
    altitude: 1700,
    description: `Sirubari (सिरुबारी) in Syangja district is globally celebrated as Nepal's first model community homestay village, recipient of the prestigious PATA Gold Award for eco-tourism. Nestled on sunny terraced slopes facing south, the entire village is immaculately paved with local slate, completely pedestrianized, and free of litter.

Managed by the Sirubari Village Tourism Development Committee (सिरुबारी ग्रामीण पर्यटन विकास समिति), visitors are welcomed on a rotational basis ensuring every household shares equitably in tourism revenue. Guests live as esteemed family members (Pahuna), eating fresh organic home-grown meals directly from the host's garden.`,
    heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    ],
    culture: {
      overview: 'Close-knit Gurung community where age-old mutual aid (Parma), organic bio-farming, and warmth towards guests are lived every day.',
      ethnicGroups: ['Gurung', 'Chhetri', 'Brahmin'],
      traditions: ['Formal Garland & Khada Welcoming Ceremony', 'Nightly Rodhi Ghar Songs', 'Community Cleanliness Drives'],
      languages: ['Nepali', 'Gurung'],
    },
    localFood: [
      {
        name: 'Organic Kodo ko Roti with Fresh Makhan',
        description: 'Hand-shaped finger millet flatbread topped with pure churned cow butter and roasted hemp seed (Bhang) chutney.',
      },
      {
        name: 'Ghiraule & Simi ko Tarkari',
        description: 'Freshly picked sponge gourd and mountain pole beans tossed in cold-pressed mustard oil with fenugreek seeds.',
      },
    ],
    festivals: [
      {
        name: 'Maghe Sankranti & Tamu Lhosar',
        month: 'Poush - Magh (January)',
        description: 'Community bonding festival with boiled wild yams (Tarul), sweet molasses, and traditional folk dances.',
      },
    ],
    attractions: [
      {
        title: 'Dahare Hill Peak (दहरे डाँडा)',
        description: 'The highest ridge in Syangja (2,300m) with sweeping views of the entire Annapurna, Manaslu, and Dhaulagiri mountain arcs.',
        distance: '2-hour rhododendron forest hike',
      },
      {
        title: 'Sirubari Organic Model Farm',
        description: 'Pioneering pesticide-free permaculture and indigenous seed conservation plots.',
        distance: 'Village periphery',
      },
    ],
    activities: [
      {
        title: 'Hands-on Village Farming & Milking',
        description: 'Experience authentic rural life by milking cows, feeding livestock, and harvesting seasonal vegetables alongside your host family.',
        difficulty: 'Easy',
      },
    ],
    transport: {
      howToReach: 'Drive south from Pokhara along the Siddhartha Highway to Naudanda or Helu, then take the scenic mountain road via Karkineta to Sirubari.',
      nearestBusStop: 'Sirubari Village Archway',
      nearestAirport: 'Pokhara International Airport - 38 km',
      roadCondition: 'Paved highway till Naudanda; well-graded mountain road to the village.',
      estimatedTravelTime: '2.5 to 3 hours from Pokhara',
    },
    bestTimeToVisit: ['September - May'],
    safetyInfo: {
      medicalFacilities: 'Sirubari Community Health Post with basic pharmaceuticals.',
      networkConnectivity: 'Reliable 4G signal (NTC & Ncell).',
      emergencyContacts: ['Sirubari Tourism Committee Helpdesk', 'Syangja District Police: 100'],
      generalTips: ['Guests stay in host homes on a rotation system to support the entire community.'],
    },
    coordinates: {
      type: 'Point',
      coordinates: [83.8447, 28.0833], // [lng, lat]
    },
    isFeatured: true,
    featuredRank: 3,
    homestayCount: 14,
  },
  {
    name: 'Helambu',
    slug: 'helambu',
    tagline: 'Sacred Hidden Valley of Hyolmo Culture & Sweet Mountain Apples',
    province: 'Bagmati',
    district: 'Sindhupalchok',
    municipality: 'Helambu Rural Municipality',
    ward: 2,
    altitude: 2600,
    description: `Helambu (हेलम्बु / ह्योल्मो) is a pristine high-altitude sanctuary just north of the Kathmandu Valley, famed for its ancient Buddhist gompas, fragrant organic apple orchards, crisp pine forests, and unique Hyolmo indigenous heritage.

Known in sacred scriptures as 'Beyul'—a hidden valley of refuge sanctified by Guru Padmasambhava in the 8th century—Helambu provides serene trekking trails, handcrafted yak cheese, and warm hospitality under the Hyolmo Community Homestay Network (ह्योल्मो सांस्कृतिक होमस्टे समाज) and Gaun Basti.`,
    heroImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    ],
    culture: {
      overview: 'Distinctive Tibetan-Buddhist Hyolmo culture with fluttering colorful prayer flags (Lungta), mani walls, and monastic festivals.',
      ethnicGroups: ['Hyolmo', 'Tamang', 'Sherpa'],
      traditions: ['Sonam & Gyalpo Lhosar', 'Butter Lamp Offerings', 'Cham Monastic Mask Dances'],
      languages: ['Hyolmo Tam', 'Tamang', 'Nepali'],
    },
    localFood: [
      {
        name: 'Fresh Nak Cheese & Su-Chya (Butter Tea)',
        description: 'Rich artisanal cheese made from high-mountain female yak (Nak) milk, served alongside hot salted butter tea.',
      },
      {
        name: 'Helambu Apple Cider & Shyaphale',
        description: 'Sweet, cloudy pressed organic apple juice accompanied by golden fried pastries stuffed with vegetables and herbs.',
      },
    ],
    festivals: [
      {
        name: 'Sonam Lhosar & Chhechu Cham Festival',
        month: 'Magh - Falgun (February)',
        description: 'Sacred monastery ritual dances depicting the triumph of wisdom over ignorance, accompanied by traditional cymbals and horns.',
      },
    ],
    attractions: [
      {
        title: 'Melamchighyang Gompa & Guru Rinpoche Meditation Cave',
        description: 'Historic centuries-old monastery and sacred cliffside meditation cave surrounded by alpine wilderness.',
        distance: 'Melamchighyang village center',
      },
    ],
    activities: [
      {
        title: 'Helambu Great Himalayan Ridge Trek',
        description: 'Hike along panoramic rhododendron ridges with front-row vistas of the Langtang, Dorje Lakpa, and Jugal Himal ranges.',
        difficulty: 'Moderate',
      },
    ],
    transport: {
      howToReach: 'Drive from Kathmandu via Melamchi Pul to Sermathang or Tarkegyang via mountain jeep, or trek scenic trails starting from Sundarijal.',
      nearestBusStop: 'Tarkegyang Central Bus Terminal',
      nearestAirport: 'Tribhuvan International Airport, Kathmandu (KTM) - 65 km',
      roadCondition: 'Blacktopped road till Melamchi; unpaved scenic mountain dirt track to upper high settlements.',
      estimatedTravelTime: '4.5 hours from Kathmandu',
    },
    bestTimeToVisit: ['March - May (Blooming Rhododendrons)', 'October - December (Crystalline Mountain Vistas)'],
    safetyInfo: {
      medicalFacilities: 'Helambu Primary Healthcare Center & Mountain Rescue Post.',
      networkConnectivity: '4G coverage in key villages; satellite phone at high posts.',
      emergencyContacts: ['Langtang National Park Checkpost', 'Helambu Police: 100'],
      generalTips: ['Acclimatize properly as altitude exceeds 2,500 meters.'],
    },
    coordinates: {
      type: 'Point',
      coordinates: [85.5583, 28.0333], // [lng, lat]
    },
    isFeatured: true,
    featuredRank: 4,
    homestayCount: 11,
  },
  {
    name: 'Sikles',
    slug: 'sikles',
    tagline: 'The Untouched Gurung Stronghold Under Annapurna II',
    province: 'Gandaki',
    district: 'Kaski',
    municipality: 'Madi Rural Municipality',
    ward: 1,
    altitude: 1980,
    description: `Sikles (सिक्लेस) is one of the largest and most authentic traditional Gurung settlements in the Annapurna Sanctuary region. Rising steeply along mountain terraces beneath the dramatic ice walls of Annapurna II (7,937m) and Lamjung Himal, Sikles remains blissfully insulated from heavy commercial tourism.

Supported by the Sikles Eco-Tourism & Gurung Community Homestay Cooperative (सिक्लेस पर्यावरण पर्यटन सहकारी) in collaboration with Gaun Basti, the village is an open-air living museum where elders weave bamboo dokos, herd sheep to high pastures, and brew sacred herbal infusions.`,
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    ],
    culture: {
      overview: 'Uncompromised Gurung Tamu traditions preserved through indigenous councils (Mukhiya system) and ancient Shamanistic nature worship.',
      ethnicGroups: ['Gurung', 'Bishwakarma'],
      traditions: ['Tamu Lhosar', 'Pujari Nature Rituals', 'Handloom Allo Weaving'],
      languages: ['Gurung', 'Nepali'],
    },
    localFood: [
      {
        name: 'Sisnu ko Soup & Sisnu Curry',
        description: 'Wild Himalayan stinging nettle soup rich in iron, simmered with mountain garlic and roasted corn grits.',
      },
      {
        name: 'Local Kukhura ra Sukuti',
        description: 'Fireplace-smoked buffalo jerky seasoned with wild Timur and served with boiled organic mountain potatoes.',
      },
    ],
    festivals: [
      {
        name: 'Tamu Lhosar & Chandi Purnima',
        month: 'December & May',
        description: 'Traditional village festivals featuring colorful folk songs, archery matches, and community feasts.',
      },
    ],
    attractions: [
      {
        title: 'Kapuche Glacial Lake (कापुचे हिमताला)',
        description: 'The lowest-altitude glacier lake in the world (2,546m), featuring tranquil turquoise ice waters fed directly by Annapurna II avalanches.',
        distance: '1-day trek from Sikles village',
      },
    ],
    activities: [
      {
        title: 'Kapuche Glacier Trek',
        description: 'Hike through virgin oak and rhododendron wilderness to reach the lowest glacial lake on planet Earth.',
        difficulty: 'Moderate',
      },
    ],
    transport: {
      howToReach: 'Drive from Pokhara (Amar Singh Chowk or Kahun Khola) along the scenic Madi River valley via 4WD jeep directly to Sikles.',
      nearestBusStop: 'Sikles Upper Jeep Station',
      nearestAirport: 'Pokhara International Airport - 42 km',
      roadCondition: 'Gravel mountain dirt track; 4WD jeep recommended.',
      estimatedTravelTime: '3.5 to 4 hours from Pokhara',
    },
    bestTimeToVisit: ['March - May', 'October - December'],
    safetyInfo: {
      medicalFacilities: 'Sikles Health Post with primary medical staff.',
      networkConnectivity: 'Good 4G coverage (Nepal Telecom).',
      emergencyContacts: ['Madi Police Post: 100', 'ACAP Sikles Unit'],
      generalTips: ['Carry warm fleece jackets as nights can get chilly.'],
    },
    coordinates: {
      type: 'Point',
      coordinates: [84.0956, 28.3586], // [lng, lat]
    },
    isFeatured: true,
    featuredRank: 5,
    homestayCount: 15,
  },
];

export async function seedVillages() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaunbasti');
      console.log(' Connected to MongoDB for Village Seeding');
    }

    for (const vData of VILLAGES_DATA) {
      const existing = await Village.findOne({ slug: vData.slug });
      if (existing) {
        await Village.updateOne({ slug: vData.slug }, vData);
        console.log(` Updated Nepali village: ${vData.name} (${vData.district}, ${vData.province})`);
      } else {
        await Village.create(vData);
        console.log(` Created Nepali village: ${vData.name} (${vData.district}, ${vData.province})`);
      }

      // Synchronize associated listings coordinates
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

    console.log(' Authentic Nepali village dataset seeded & synced successfully!');
  } catch (err) {
    console.error(' Village seeding error:', err);
    throw err;
  }
}

// Run directly if called as a script
if (require.main === module) {
  seedVillages()
    .then(() => {
      mongoose.disconnect();
      process.exit(0);
    })
    .catch(() => {
      mongoose.disconnect();
      process.exit(1);
    });
}

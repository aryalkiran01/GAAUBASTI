export {};
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Article = require('../models/Article');

if (process.env.NODE_ENV === 'production') {
  console.error('FATAL: seedArticles cannot be executed in production environment!');
  process.exit(1);
}

const ARTICLES_DATA = [
  {
    title: 'A Journey Through Ghandruk: Slate Roofs, Gurung Heritage, and Annapurna Views',
    slug: 'journey-through-ghandruk-gurung-heritage',
    category: 'culture',
    summary: 'Discover the living traditions of the Tamu community in Ghandruk, where traditional hospitality meets breathtaking Himalayan sunrises.',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80',
    author: {
      name: 'Pasang Tamu',
      role: 'Cultural Historian & Trek Leader',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
    },
    tags: ['Ghandruk', 'Gurung Culture', 'Annapurna', 'Homestay'],
    villageSlug: 'ghandruk',
    isFeatured: true,
    readingTime: '6 min read',
    published: true,
    content: `## The Timeless Hamlets of the Annapurna
Perched at an altitude of 1,940 meters, the stone village of Ghandruk stands as one of Nepal’s greatest treasures of indigenous heritage. Walking along its slate-paved alleyways feels like stepping back through centuries of living Gurung (Tamu) history.

Every sunrise here is a spectacle: as the first rays strike the sheer face of Machhapuchhre (Fishtail) and Annapurna South, the entire hamlet comes alive with the aroma of woodsmoke, freshly churned buffalo milk, and simmering herbal tea.

### The Gurung Code of Hospitality
In Ghandruk, hospitality is not a commercial transaction—it is a sacred community duty rooted in the ancient concept of *Pahuna Satkar*. Host families welcome guests with handmade marigold garlands and freshly brewed butter tea.

> "When you enter a Gurung home, you do not stay as a tourist; you eat at our family hearth as a son or daughter."

### Key Cultural Experiences:
1. **The Gurung Cultural Museum**: Located in the village core, housing ancient armaments, ceremonial textiles, and ancestral brassware.
2. **Traditional Attire Sessions**: Try on the handcrafted Ghalek, velvet blouse, and customary coral necklace.
3. **Evening Rodhi Melodies**: Listen to acoustic Madal folk songs recited around the fireplace.

### Sustainable Homestay Etiquette
When visiting Ghandruk, travel mindfully:
- Always ask before photographing elders or domestic rituals.
- Remove shoes before entering private family kitchen quarters.
- Support local artisans by purchasing hand-woven nettle shawls and organic wild honey.`,
  },
  {
    title: 'Taste of the Mountains: A Guide to Authentic Nepali Village Cuisine',
    slug: 'guide-to-authentic-nepali-village-cuisine',
    category: 'food',
    summary: 'From slow-cooked Dhindo and sundried Gundruk to wild Timur chutneys, explore the wholesome organic flavors of Nepal’s hills.',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    author: {
      name: 'Srijana Shrestha',
      role: 'Culinary Ethnographer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
    },
    tags: ['Food', 'Organic', 'Dhindo', 'Gundruk', 'Nepal Cuisine'],
    isFeatured: true,
    readingTime: '5 min read',
    published: true,
    content: `## Beyond Standard Dal Bhat
While standard lentil soup and rice are daily staples across South Asia, traditional Nepali village cuisine in the high hills possesses a rich biodiversity of mountain grains, wild forest herbs, and fermented delicacies found nowhere else.

### 1. Dhindo: The Energy of the Himalayas
Dhindo is a steaming, thick porridge prepared by vigorously whipping stone-ground buckwheat or finger millet (Kodo) flour in boiling water inside an iron pot (*Karahi*). Traditionally eaten by dipping small morsels into flavorful local chicken broth (*Kukhura ko Jhol*) or hot melted ghee.

### 2. Gundruk & Sinki: Masterpieces of Natural Fermentation
Before winter frost sets in, village families harvest mustard and radish leaves, ferment them naturally in earthenware pots, and sun-dry them into crisp *Gundruk*. Rich in probiotics and packed with earthy umami flavor, it forms the backbone of mountain soup broths.

### 3. Wild Sichuan Pepper (Timur)
Hand-foraged from thorny shrubs in high mid-hills, black Timur seeds produce an electric tingling sensation on the palate. Ground with roasted Himalayan hemp seeds (*Bhang ko Achar*) and wild mountain tomatoes, it transforms simple roasted potatoes into a culinary feast.

### The Farm-to-Table Reality
In community homestays across Nepal, 90% of ingredients are harvested within a 100-meter radius of the kitchen hearth. Every meal you eat directly supports ecological hill farming.`,
  },
  {
    title: 'Bandipur: Preserving 18th-Century Newari Architecture in the Hilltops',
    slug: 'bandipur-preserving-newari-architecture-hilltops',
    category: 'heritage',
    summary: 'How an abandoned hilltop merchant town transformed into a vehicle-free architectural sanctuary of Newari culture.',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=80',
    author: {
      name: 'Bikram Pradhan',
      role: 'Architectural Conservationist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
    },
    tags: ['Bandipur', 'Newari Architecture', 'Heritage', 'Gandaki'],
    villageSlug: 'bandipur',
    isFeatured: false,
    readingTime: '7 min read',
    published: true,
    content: `## The Merchant Town That Time Forgot
When the Prithvi Highway was completed in the 1970s along the Marshyangdi river valley below, the hilltop trading post of Bandipur was left bypassed and silent. Paradoxically, this geographic isolation saved the town from unregulated modern concrete construction.

Today, Bandipur stands as one of South Asia’s best-preserved examples of 18th-century Newari town planning.

### Architectural Treasures
- **The Main Bazaar**: A broad, slate-paved promenade strictly closed to motor vehicles, lined on both sides by traditional multi-tiered merchant mansions with carved wooden overhangs (*Aakhi Jhyal*).
- **Thani Mai Hilltop Temple**: Perched atop Gurungche Hill, offering 360-degree sunrise views over Manaslu, Himalchuli, and Annapurna.
- **Siddha Cave**: The largest natural limestone cavern system in the Himalayas.

### How to Explore Mindfully
Stroll quietly in the morning when children walk to school in uniforms and elderly Newari shopkeepers light morning incense at streetside stone shrines. Stay in family-run heritage homestays to ensure your travel funds directly maintain these historic slate-and-timber homes.`,
  },
  {
    title: 'Responsible Travel in Nepal: The Homestay Code of Ethics',
    slug: 'responsible-travel-nepal-homestay-code-of-ethics',
    category: 'travel-guide',
    summary: 'Essential cultural tips, etiquette, and environmental guidelines for staying with rural host families in Nepal.',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80',
    author: {
      name: 'Gaun Basti Community Team',
      role: 'Community Tourism Network',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
    },
    tags: ['Eco-tourism', 'Etiquette', 'Sustainability', 'Travel Guide'],
    isFeatured: false,
    readingTime: '4 min read',
    published: true,
    content: `## Traveling with Respect in Nepal’s Rural Hamlets
Living in a rural homestay is one of the most rewarding cultural experiences in the world. To make sure your visit creates positive social and ecological impact, follow these core community principles:

### 1. Water & Waste Management
- Hill villages often rely on mountain springs and gravity-fed piping. Practice water conservation during showers.
- Carry a reusable water bottle with purification tablets or filters. Avoid single-use plastic bottles.
- Pack out non-biodegradable waste (batteries, plastic packaging) back to major cities for proper recycling.

### 2. Cultural Norms
- Dress modestly: shoulders and knees should be covered, especially when visiting community temples or monastery premises.
- Always use your right hand when giving or receiving items or food.
- Greet locals with palms pressed together and a warm *"Namaste"*.

### 3. Fair Economic Distribution
Eat local meals prepared by your host rather than purchasing packaged processed snacks from outside. Your lodging and meal fees provide crucial income that funds school supplies and community healthcare in remote mountain areas.`,
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaunbasti');
    console.log(' Connected to MongoDB for Article Seeding');

    for (const art of ARTICLES_DATA) {
      const existing = await Article.findOne({ slug: art.slug });
      if (existing) {
        await Article.updateOne({ slug: art.slug }, art);
        console.log(` Updated article: ${art.title}`);
      } else {
        await Article.create(art);
        console.log(` Created article: ${art.title}`);
      }
    }

    console.log(' Article seeding complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(' Article seeding error:', err);
    process.exit(1);
  }
}

seed();

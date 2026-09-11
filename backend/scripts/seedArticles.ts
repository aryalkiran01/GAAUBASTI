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

export const ARTICLES_DATA = [
  {
    title: 'A Journey Through Ghandruk: Slate Roofs, Gurung Heritage, and Annapurna Views',
    slug: 'journey-through-ghandruk-gurung-heritage',
    category: 'culture',
    summary: 'Discover the living traditions of the Tamu community in Ghandruk, where traditional hospitality meets breathtaking Himalayan sunrises.',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80',
    author: {
      name: 'Pasang Gurung (पासाङ गुरुङ)',
      role: 'Cultural Historian & Lead Researcher, Gaun Basti Nepal',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    tags: ['Ghandruk', 'Gurung Culture', 'Annapurna', 'Community Homestay', 'Nepal Tourism'],
    villageSlug: 'ghandruk',
    isFeatured: true,
    readingTime: '6 min read',
    published: true,
    content: `## The Timeless Hamlets of the Annapurna
Perched at an altitude of 1,940 meters, the stone village of Ghandruk stands as one of Nepal’s greatest treasures of indigenous heritage. Walking along its slate-paved alleyways feels like stepping back through centuries of living Gurung (Tamu) history.

Every sunrise here is a spectacle: as the first rays strike the sheer face of Machhapuchhre (Fishtail) and Annapurna South, the entire hamlet comes alive with the aroma of woodsmoke, freshly churned buffalo milk, and simmering herbal tea.

### The Gurung Code of Hospitality (*Pahuna Satkar*)
In Ghandruk, hospitality is not a commercial transaction—it is a sacred community duty rooted in the ancient concept of *Pahuna Satkar* (पाहुना सत्कार). Host families affiliated with the **Ghandruk Community Homestay Management Committee** welcome guests with handmade marigold garlands, white ceremonial khadas, and freshly brewed butter tea.

> "When you enter a Gurung home, you do not stay as a tourist; you eat at our family hearth as a son or daughter."

### Key Cultural Experiences
1. **The Gurung Cultural Museum (घान्द्रुक संग्रहालय)**: Located in the village core, showcasing centuries-old ancestral brassware, ceremonial textiles, and Gurkha weaponry.
2. **Traditional Attire Sessions**: Try on the handcrafted Ghalek, velvet Cholo blouse, and customary coral and turquoise necklaces (*Kanthe Mala*).
3. **Evening Rodhi Melodies**: Listen to acoustic Madal and Tungna folk songs recited around the family hearth (*Chulho*).

### Sustainable Homestay Etiquette
When visiting Ghandruk with **Gaun Basti**:
- Always ask respectfully before photographing village elders or domestic prayer rituals.
- Remove shoes before entering private family kitchen quarters.
- Support local artisans by purchasing hand-woven Himalayan nettle (Allo) shawls and organic wild cliff honey (*Bhir Mauri ko Maha*).`,
  },
  {
    title: 'Taste of the Mountains: A Guide to Authentic Nepali Village Cuisine',
    slug: 'guide-to-authentic-nepali-village-cuisine',
    category: 'food',
    summary: 'From slow-cooked Dhindo and sundried Gundruk to wild Timur and Sisnu broths, explore the wholesome organic flavors of Nepal’s hills.',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    author: {
      name: 'Srijana Shrestha (सृजना श्रेष्ठ)',
      role: 'Indigenous Food Researcher, Nepal Culinary Heritage Trust',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    },
    tags: ['Food', 'Organic', 'Dhindo', 'Gundruk', 'Nepal Cuisine', 'Farm-to-Table'],
    isFeatured: true,
    readingTime: '5 min read',
    published: true,
    content: `## Beyond Standard Dal Bhat: The Biodiversity of Nepal's Kitchens
While lentil soup and rice (*Dal Bhat*) are national staples, authentic Nepali village kitchens in the high hills possess an extraordinary biodiversity of mountain grains, wild forest herbs, and natural ferments found nowhere else.

Under the **Gaun Basti Sustainable Food Initiative**, community homestays preserve zero-kilometer farm-to-table traditions.

### 1. Dhindo: The Energy of the Himalayas
Dhindo (ढिँडो) is a steaming, dense porridge prepared by vigorously whipping stone-ground buckwheat (*Phapar*) or finger millet (*Kodo*) flour into boiling water inside a heavy cast-iron cauldron (*Karahi*). Traditionally eaten without chewing, morsels are dipped into rich mountain chicken broth (*Kukhura ko Jhol*) or hot churned buffalo ghee.

### 2. Gundruk & Sinki: Masterpieces of Natural Bio-Fermentation
Before winter frosts arrive, village families harvest wild mustard and radish leaves, press them tightly into clay pots, and sun-dry them into crisp *Gundruk*. Packed with probiotics and rich umami depth, Gundruk soup served with roasted soybeans (*Bhatmas*) forms the backbone of winter nutrition.

### 3. Wild Himalayan Stinging Nettle (Sisnu)
Hand-harvested from high forest slopes using bamboo tongs, young stinging nettle leaves are simmered into iron-rich *Sisnu ko Jhol*. Seasoned with Himalayan aromatic herb *Jimbu* fried in hot mustard oil, it is revered across the Himalayas for its vitality and restorative health benefits.

### 4. Wild Sichuan Pepper (Timur)
Hand-foraged from thorny high mid-hill shrubs, black Timur seeds produce an electric, tingling citrus sensation. Ground with roasted hemp seeds (*Bhang ko Achar*) and fire-roasted mountain tomatoes, it transforms everyday meals into culinary celebrations.`,
  },
  {
    title: 'Bandipur: Preserving 18th-Century Newari Architecture in the Hilltops',
    slug: 'bandipur-preserving-newari-architecture-hilltops',
    category: 'heritage',
    summary: 'How an abandoned hilltop merchant town transformed into a vehicle-free architectural sanctuary of Newari culture.',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=80',
    author: {
      name: 'Bikram Pradhan (बिक्रम प्रधान)',
      role: 'Heritage Architect & Advisor, Tanahun Tourism Council',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    },
    tags: ['Bandipur', 'Newari Architecture', 'Heritage', 'Gandaki', 'Gaun Basti'],
    villageSlug: 'bandipur',
    isFeatured: false,
    readingTime: '7 min read',
    published: true,
    content: `## The Merchant Town That Time Forgot
When the Prithvi Highway was opened in the 1970s along the Marshyangdi river valley below, the bustling hilltop trading hub of Bandipur was left bypassed and isolated. Paradoxically, this economic detour shielded the town from unregulated concrete demolition.

Today, through concerted restoration led by the **Bandipur Tourism Development Committee** and **Gaun Basti Heritage Hub**, Bandipur stands as one of South Asia’s best-preserved examples of 18th-century Newari town planning.

### Architectural Treasures
- **The Vehicle-Free Promenade**: A wide, slate-paved street strictly closed to motor cars, flanked on both sides by three-story brick-and-timber merchant residences featuring intricately carved wooden lattice windows (*Aakhi Jhyal*).
- **Thani Mai Hilltop Temple**: Perched atop Gurungche Hill, offering 360-degree sunrise vistas across Manaslu, Himalchuli, and the Annapurna range.
- **Siddha Cave (सिद्ध गुफा)**: The largest natural limestone cavern in Nepal.

### How to Explore Mindfully
Stroll the stone street at dawn when children walk to school in uniforms and elderly Newari shopkeepers light aromatic incense at roadside stone shrines. Staying in family-run heritage homestays directly finances the continuous restoration of these ancient timber homes.`,
  },
  {
    title: 'Responsible Travel in Nepal: The Homestay Code of Ethics',
    slug: 'responsible-travel-nepal-homestay-code-of-ethics',
    category: 'travel-guide',
    summary: 'Essential cultural tips, environmental guidelines, and etiquette for staying with rural host families across Nepal.',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&auto=format&fit=crop&q=80',
    author: {
      name: 'Gaun Basti Editorial & Community Research Team (गाउँ बस्ती)',
      role: 'Nepal Rural Tourism & Community Homestay Collective',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    },
    tags: ['Eco-tourism', 'Etiquette', 'Sustainability', 'Nepal Tourism', 'Travel Guide'],
    isFeatured: false,
    readingTime: '4 min read',
    published: true,
    content: `## Traveling with Respect in Nepal’s Rural Hamlets
Living with a host family in a Nepali village homestay is one of the most heartwarming cultural experiences in the world. To ensure your visit creates a positive social, ecological, and economic footprint, the **Gaun Basti Stays Hub** recommends following these community guidelines:

### 1. Water & Waste Management
- Mountain villages often rely on gravity-fed mountain spring water. Conserve water during showers and washing.
- Carry a reusable water bottle with purification tablets. Say no to single-use plastic bottles.
- Pack out non-biodegradable trash (plastic wrappers, batteries) back to city recycling hubs.

### 2. Cultural Customs & Etiquette
- Dress modestly: shoulders and knees should be covered, especially when visiting community temples or monastery premises.
- Always use your right hand (or both hands) when offering or receiving food and items.
- Greet hosts with palms pressed together and a warm *"Namaste"* or *"Tashi Delek"*.

### 3. Fair Economic Empowerment
Eat authentic home-cooked meals prepared by your host rather than bringing commercial packaged snacks from outside. 100% of your homestay accommodation and food payments go directly to local families, funding children's education and community healthcare in rural Nepal.`,
  },
  {
    title: 'Sikles & Kapuche: Exploring the Lowest Glacial Lake on Earth',
    slug: 'sikles-kapuche-lowest-glacial-lake',
    category: 'travel-guide',
    summary: 'A trek through the dense rhododendron forests of Sikles to the turquoise waters of Kapuche Lake under Annapurna II.',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    author: {
      name: 'Dhan Bahadur Gurung (धनबहादुर गुरुङ)',
      role: 'Lead Nature Guide, Sikles Eco-Tourism Cooperative',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    },
    tags: ['Sikles', 'Kapuche', 'Glacier Lake', 'Annapurna', 'Trekking'],
    villageSlug: 'sikles',
    isFeatured: true,
    readingTime: '6 min read',
    published: true,
    content: `## The Secret Wilderness of Madi Valley
While popular trekking circuits often draw crowds, the pristine Madi valley of Kaski district holds one of Nepal's most well-kept ecological wonders: **Kapuche Glacier Lake (कापुचे हिमताला)**.

Situated at an altitude of just 2,546 meters, Kapuche is verified by glaciologists as the lowest-altitude glacier-fed lake on Earth.

### The Journey from Sikles Village
Starting from the slate-roofed terraces of **Sikles (सिक्लेस)**, the trail descends to the crystal-clear Madi river before climbing through virgin oak, moss-draped pines, and blooming rhododendron forests.

Along the trail, hikers rest at **Hugon**, enjoying hot black tea sweetened with mountain honey before reaching the serene glacial amphitheater of Kapuche.

### Nature Conservation Principles
Under the stewardship of the **Sikles Eco-Tourism Cooperative** and **Gaun Basti**:
- Camping is restricted to designated sustainable zones.
- Bathing or polluting the sacred glacial waters is strictly forbidden.
- Local Gurung youth serve as certified nature guides, ensuring visitor safety and environmental protection.`,
  },
];

export async function seedArticles() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gaunbasti');
      console.log(' Connected to MongoDB for Article Seeding');
    }

    for (const art of ARTICLES_DATA) {
      const existing = await Article.findOne({ slug: art.slug });
      if (existing) {
        await Article.updateOne({ slug: art.slug }, art);
        console.log(` Updated Nepali article: ${art.title}`);
      } else {
        await Article.create(art);
        console.log(` Created Nepali article: ${art.title}`);
      }
    }

    console.log(' Authentic Nepali articles dataset seeded successfully!');
  } catch (err) {
    console.error(' Article seeding error:', err);
    throw err;
  }
}

// Run directly if called as a script
if (require.main === module) {
  seedArticles()
    .then(() => {
      mongoose.disconnect();
      process.exit(0);
    })
    .catch(() => {
      mongoose.disconnect();
      process.exit(1);
    });
}

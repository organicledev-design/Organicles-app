const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const cloudinaryUrls = {
  "1770968814733-black-pepper.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614977/1770968814733-black-pepper_b5zfmf.jpg",
  "1770968814757-brown-sugar.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614977/1770968814757-brown-sugar_om5cix.jpg",
  "1770968814776-cardamom.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614977/1770968814776-cardamom_cskvyw.jpg",
  "1770968814794-chia-seed.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614978/1770968814794-chia-seed_bl2ybe.jpg",
  "1770968814811-cinnamon.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614978/1770968814811-cinnamon_vixibv.jpg",
  "1770968814829-clove.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614978/1770968814829-clove_gljvor.jpg",
  "1770968814845-coconut-oil.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614978/1770968814845-coconut-oil_fzodux.jpg",
  "1770968814873-honey.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614978/1770968814873-honey_zk2kd2.jpg",
  "1770968814890-methi-dana.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614978/1770968814890-methi-dana_nyq1qw.jpg",
  "1770968814906-moringa.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614979/1770968814906-moringa_vbzjaj.jpg",
  "1770968814923-olive-oil-2.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614979/1770968814923-olive-oil-2_nm2gr9.jpg",
  "1770968814939-pink-salt.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614979/1770968814939-pink-salt_ms1zpa.jpg",
  "1770968814956-shilajit.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1770968814956-shilajit_xwk508.jpg",
  "1770968814977-spices-opt.-2.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1770968814994-turmeric_hvcbnp.jpg",
  "1770968814994-turmeric.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614980/1770968814994-turmeric_hvcbnp.jpg",
  "1770969560167-desi-ghee.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614981/desi-ghee_oa8vm7.jpg",
  "1770969560212-zero-pain-oil.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614977/1770969560212-zero-pain-oil_rcas9b.jpg",
  "1770969560194-nashta.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614981/nashta_mddzr8.jpg",
  "1770969560124-Vitaman.jpg": "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614981/1770969560124-Vitaman_ml0abv.jpg",
};
const uploadUrl = (filename) => cloudinaryUrls[filename] || filename;async function main() {
  console.log("🌱 Seeding database...");

  // Reset content tables for deterministic local seeds
  await prisma.product.deleteMany();
  await prisma.review.deleteMany();
  await prisma.partner.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "Black Pepper",
        description: "Pure black pepper for daily cooking.",
        price: 10,
        images: JSON.stringify([uploadUrl("1770968814733-black-pepper.jpg")]),
        category: "Spices",
        featured: true,
        bestSeller: false,
        stock: 50,
        tags: JSON.stringify(["Organic", "Spice"]),
      },
      {
        name: "Brown Sugar",
        description: "Natural brown sugar with rich flavor.",
        price: 1200,
        images: JSON.stringify([uploadUrl("1770968814757-brown-sugar.jpg")]),
        category: "Sweeteners",
        featured: false,
        bestSeller: false,
        stock: 45,
        tags: JSON.stringify(["Natural", "Sweetener"]),
      },
      {
        name: "Cardamom",
        description: "Premium cardamom pods.",
        price: 2200,
        images: JSON.stringify([uploadUrl("1770968814776-cardamom.jpg")]),
        category: "Spices",
        featured: true,
        bestSeller: false,
        stock: 32,
        tags: JSON.stringify(["Aromatic", "Spice"]),
      },
      {
        name: "Chia Seed",
        description: "High-fiber chia seeds for daily nutrition.",
        price: 1400,
        images: JSON.stringify([uploadUrl("1770968814794-chia-seed.jpg")]),
        category: "Seeds",
        featured: false,
        bestSeller: false,
        stock: 40,
        tags: JSON.stringify(["Fiber", "Superfood"]),
      },
      {
        name: "Cinnamon",
        description: "Aromatic cinnamon for tea and cooking.",
        price: 1650,
        images: JSON.stringify([uploadUrl("1770968814811-cinnamon.jpg")]),
        category: "Spices",
        featured: false,
        bestSeller: false,
        stock: 35,
        tags: JSON.stringify(["Spice", "Aromatic"]),
      },
      {
        name: "Clove",
        description: "Whole cloves with strong natural aroma.",
        price: 1800,
        images: JSON.stringify([uploadUrl("1770968814829-clove.jpg")]),
        category: "Spices",
        featured: false,
        bestSeller: false,
        stock: 28,
        tags: JSON.stringify(["Spice", "Whole"]),
      },
      {
        name: "Coconut Oil",
        description: "Cold-pressed coconut oil for cooking and wellness.",
        price: 2300,
        images: JSON.stringify([uploadUrl("1770968814845-coconut-oil.jpg")]),
        category: "Oils",
        featured: true,
        bestSeller: false,
        stock: 30,
        tags: JSON.stringify(["Cold-Pressed", "Oil"]),
      },
      {
        name: "Honey",
        description: "Raw honey sourced from trusted farms.",
        price: 2000,
        images: JSON.stringify([uploadUrl("1770968814873-honey.jpg")]),
        category: "Sweeteners",
        featured: true,
        bestSeller: false,
        stock: 55,
        tags: JSON.stringify(["Raw", "Natural"]),
      },
      {
        name: "Methi Dana",
        description: "Fresh fenugreek seeds for daily health.",
        price: 900,
        images: JSON.stringify([uploadUrl("1770968814890-methi-dana.jpg")]),
        category: "Seeds",
        featured: false,
        bestSeller: false,
        stock: 60,
        tags: JSON.stringify(["Fenugreek", "Seed"]),
      },
      {
        name: "Moringa Powder",
        description: "Premium moringa leaf powder",
        price: 1200,
        images: JSON.stringify([uploadUrl("1770968814906-moringa.jpg")]),
        category: "Supplements",
        featured: false,
        bestSeller: false,
        stock: 30,
        tags: JSON.stringify(["Superfood"]),
      },
      {
        name: "Olive Oil",
        description: "Extra virgin olive oil for healthy meals.",
        price: 2900,
        images: JSON.stringify([uploadUrl("1770968814923-olive-oil-2.jpg")]),
        category: "Oils",
        featured: true,
        bestSeller: false,
        stock: 22,
        tags: JSON.stringify(["Extra Virgin", "Oil"]),
      },
      {
        name: "Pink Salt",
        description: "Himalayan pink salt for mineral-rich seasoning.",
        price: 1050,
        images: JSON.stringify([uploadUrl("1770968814939-pink-salt.jpg")]),
        category: "Spices",
        featured: false,
        bestSeller: false,
        stock: 44,
        tags: JSON.stringify(["Mineral", "Salt"]),
      },
      {
        name: "Shilajit",
        description: "Pure shilajit resin for vitality support.",
        price: 4000,
        images: JSON.stringify([uploadUrl("1770968814956-shilajit.jpg")]),
        category: "Supplements",
        featured: true,
        bestSeller: false ,
        stock: 18,
        tags: JSON.stringify(["Resin", "Energy"]),
      },
      {
        name: "Spices Opt. 2",
        description: "Balanced spice blend for everyday use.",
        price: 1300,
        images: JSON.stringify([uploadUrl("1770968814977-spices-opt.-2.jpg")]),
        category: "Spices",
        featured: false,
        bestSeller: false,
        stock: 26,
        tags: JSON.stringify(["Blend", "Spice"]),
      },
      {
        name: "Turmeric",
        description: "Pure turmeric powder with rich color.",
        price: 1200,
        images: JSON.stringify([uploadUrl("1770968814994-turmeric.jpg")]),
        category: "Spices",
        featured: false,
        bestSeller: false,
        stock: 48,
        tags: JSON.stringify(["Haldi", "Spice"]),
      },
      {
        name: "Desi Ghee",
        description: "Traditional desi ghee made from pure ingredients.",
        price: 5500,
        images: JSON.stringify([uploadUrl("1770969560167-desi-ghee.jpg")]),
        category: "Breakfast",
        featured: true,
        bestSeller: true,
        bestSellerOrder: 3,

        stock: 24,
        tags: JSON.stringify(["Best Seller", "Traditional"]),
      },
      {
        name: "Zero Pain Oil",
        description: "Natural massage oil for muscle and joint support.",
        price: 2200,
        images: JSON.stringify([uploadUrl("1770969560212-zero-pain-oil.jpg")]),
        category: "Wellness",
        featured: true,
        bestSeller: true,
        bestSellerOrder: 4,

        stock: 36,
        tags: JSON.stringify(["Massage", "Pain Relief"]),
      },
      {
        name: "Nashta",
        description: "Nutritious traditional breakfast blend.",
        price:2950,
        images: JSON.stringify([uploadUrl("1770969560194-nashta.jpg")]),
        category: "Breakfast",
        featured: true,
        bestSeller: true,
        bestSellerOrder: 1,

        stock: 20,
        tags: JSON.stringify(["Breakfast", "Energy"]),
      },
      {
        name: "Vitaman",
        description: "Daily vitality blend for active lifestyle.",
        price: 4000,
        images: JSON.stringify([uploadUrl("1770969560124-Vitaman.jpg")]),
        category: "Supplements",
        featured: true,
        bestSeller: true,
        bestSellerOrder: 2,

        stock: 18,
        tags: JSON.stringify(["Supplement", "Vitality"]),
      },
    ],
  });
  await prisma.review.createMany({
    data: [
      {
        userName: "Ayesha Khan",
        rating: 5,
        comment:
          "Excellent quality! The Zafrani Nashta has improved my morning routine. Highly recommend Organicles products.",
        date: "2026-01-15",
        avatar: null,
        isPublished: true,
      },
      {
        userName: "Ahmed Ali",
        rating: 5,
        comment:
          "Genuine organic products at great prices. Fast delivery and well-packaged. Will order again!",
        date: "2026-01-20",
        avatar: null,
        isPublished: true,
      },
      {
        userName: "Fatima Hassan",
        rating: 4,
        comment:
          "Good quality Shilajit. Noticed improvement in energy levels after regular use. Packaging could be better.",
        date: "2026-01-22",
        avatar: null,
        isPublished: true,
      },
      {
        userName: "Mohammad Raza",
        rating: 5,
        comment:
          "Best organic store in Pakistan! Authentic products and excellent customer service. Keep it up!",
        date: "2026-01-25",
        avatar: null,
        isPublished: true,
      },
    ],
  });

  await prisma.partner.createMany({
  data: [
    {
      name: "Partner 1",
      logo: "https://res.cloudinary.com/dsaavzn5p/image/upload/f_jpg/v1773211691/l1_245x_hztmzx.avif",
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Partner 2",
      logo: "https://res.cloudinary.com/dsaavzn5p/image/upload/f_jpg/v1773211691/l2_245x_kk9ztp.avif",
      sortOrder: 2,
      isActive: true,
    },
    {
      name: "Partner 3",
      logo: "https://res.cloudinary.com/dsaavzn5p/image/upload/f_jpg/v1773211691/l4_245x_cxbkjs.avif",
      sortOrder: 3,
      isActive: true,
    },
    {
      name: "Partner 4",
      logo: "https://res.cloudinary.com/dsaavzn5p/image/upload/f_jpg/v1773211691/i5_245x_g3yafe.avif",
      sortOrder: 4,
      isActive: true,
    },
    {
      name: "Partner 5",
      logo: "https://res.cloudinary.com/dsaavzn5p/image/upload/f_jpg/v1773211691/i6_245x_rnfyjp.avif",
      sortOrder: 5,
      isActive: true,
    },
  ],
});
  await prisma.heroBanner.deleteMany();
await prisma.heroBanner.createMany({
  data: [
    {
      imageUrl: "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614978/1771222572949-website_banner_1252_x_608_px_unnx6s.webp",
      title: "Banner 1",
      isActive: true,
      sortOrder: 1,
    },
    {
      imageUrl: "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614978/1771222573031-website_banner_1252_x_608_px_3_yrf5cb.webp",
      title: "Banner 2",
      isActive: true,
      sortOrder: 2,
    },
    {
      imageUrl: "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614979/1771222573087-zero_pain_oil_CB_lg4dyf.webp",
      title: "Banner 3",
      isActive: true,
      sortOrder: 3,
    },
    {
      imageUrl: "https://res.cloudinary.com/dsaavzn5p/image/upload/v1772614979/1771225384074-Vitaman_banner_v2_xzwme7.png",
      title: "Banner 4",
      isActive: true,
      sortOrder: 4,
    },
  ],
});

  console.log("✅ Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




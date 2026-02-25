const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const dbPath = path.resolve(__dirname, "dev.db");

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});

const prisma = new PrismaClient({ adapter });
const ASSET_BASE_URL = process.env.ASSET_BASE_URL || "http://10.0.2.2:5000";
const uploadUrl = (filename) => `${ASSET_BASE_URL}/uploads/${filename}`;

async function main() {
  console.log("ðŸŒ± Seeding database...");

  // Reset content tables for deterministic local seeds
  await prisma.product.deleteMany();
  await prisma.review.deleteMany();
  await prisma.partner.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "Black Pepper",
        description: "Pure black pepper for daily cooking.",
        price: 1500,
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
        price: 3850,
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
        name: "Organic Certification Board",
        logo: "https://via.placeholder.com/100x50/2D5016/FFFFFF?text=OCB",
        sortOrder: 1,
        isActive: true,
      },
      {
        name: "Natural Health Association",
        logo: "https://via.placeholder.com/100x50/4A7C2B/FFFFFF?text=NHA",
        sortOrder: 2,
        isActive: true,
      },
      {
        name: "Pure Foods Pakistan",
        logo: "https://via.placeholder.com/100x50/2D5016/FFFFFF?text=PFP",
        sortOrder: 3,
        isActive: true,
      },
      {
        name: "Wellness Council",
        logo: "https://via.placeholder.com/100x50/4A7C2B/FFFFFF?text=WC",
        sortOrder: 4,
        isActive: true,
      },
      {
        name: "Green Living Initiative",
        logo: "https://via.placeholder.com/100x50/2D5016/FFFFFF?text=GLI",
        sortOrder: 5,
        isActive: true,
      },
    ],
  });

  console.log("âœ… Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


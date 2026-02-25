const prisma = require("../prisma");

const parseJsonField = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

const buildAssetUrl = (req, rawUrl) => {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) return rawUrl;
  const match = rawUrl.match(/\/uploads\/.+$/);
  if (!match) return rawUrl;
  return `${req.protocol}://${req.get("host")}${match[0]}`;
};

const normalizeProduct = (req, product) => {
  const images = parseJsonField(product.images, []);
  const normalizedImages = Array.isArray(images)
    ? images.map((url) => buildAssetUrl(req, url))
    : [];

  return {
    ...product,
    images: normalizedImages,
    tags: parseJsonField(product.tags, []),
  };
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: products.length,
      products: products.map((p) => normalizeProduct(req, p)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product: normalizeProduct(req, product),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

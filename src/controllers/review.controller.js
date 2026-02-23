const prisma = require("../prisma");

exports.getReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

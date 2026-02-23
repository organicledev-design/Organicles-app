const prisma = require("../prisma");

exports.getPartners = async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return res.status(200).json({
      success: true,
      count: partners.length,
      partners,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch partners",
      error: error.message,
    });
  }
};

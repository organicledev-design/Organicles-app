const prisma = require('../prisma');

const getActiveHeroBanners = async (req, res) => {
  try {
    const banners = await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return res.json({ success: true, data: banners });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch hero banners',
      error: error.message,
    });
  }
};

const createHeroBanner = async (req, res) => {
  try {
    const { imageUrl, title, isActive, sortOrder } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }

    const banner = await prisma.heroBanner.create({
      data: {
        imageUrl,
        title: title || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
      },
    });

    return res.status(201).json({ success: true, data: banner });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create hero banner',
      error: error.message,
    });
  }
};

module.exports = {
  getActiveHeroBanners,
  createHeroBanner,
};

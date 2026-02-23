const prisma = require("../prisma");

exports.getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};
// backend: controllers/order.controller.js
exports.createCODOrder = async (req, res) => {
  try {
    const { orderId, items, shippingAddress, totalAmount } = req.body;

    console.log('Creating COD order with data:', { orderId, items, shippingAddress, totalAmount });

    if (!items || !shippingAddress || !totalAmount) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const order = await prisma.order.create({
      data: {
        // id: orderId,
        items: JSON.stringify(items),
        shippingAddress: JSON.stringify(shippingAddress),
        totalAmount,
        status: 'PENDING',
        paymentMethod: 'COD',
      },
    });

    console.log('COD order created successfully:', order);

    res.status(201).json({
      success: true,
      order: order,
    });
  } catch (err) {
    console.error('COD Order error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

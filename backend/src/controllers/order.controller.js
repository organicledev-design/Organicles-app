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

    if (!items || !shippingAddress || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const order = await prisma.order.create({
      data: {
        items: JSON.stringify(items),
        shippingAddress: JSON.stringify(shippingAddress),
        totalAmount,
        status: 'PENDING',
        paymentMethod: 'COD',
      },
    });

    // Send receipt email
    const email = shippingAddress.email;
    if (email) {
      try {
        await sendOrderReceipt({
          to: email,
          order,
          items,
          address: shippingAddress,
        });
        console.log('Receipt email sent to:', email);
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr.message);
        // Don't fail the order if email fails
      }
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('COD Order error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

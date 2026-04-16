const prisma = require('../prisma');

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({ success: true, token: process.env.ADMIN_SECRET });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { payments: true },
    });
    res.json({ success: true, count: orders.length, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['PENDING', 'CONFIRMED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.payment.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
const prisma = require('../prisma');


exports.createOrderAndPayment = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      totalAmount,
      paymentMethod,
      walletPhone,
      walletProvider,
    } = req.body;

    // ✅ FIX 2: proper validation
    if (!items || !shippingAddress || !totalAmount || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ FIX 3: wallet-specific validation
    if (paymentMethod === 'WALLET' && (!walletPhone || !walletProvider)) {
      return res
        .status(400)
        .json({ message: 'Wallet provider and phone number are required' });
    }

    const txnRef = `TXN-${Date.now()}`;

    // ✅ FIX 4: atomic transaction 
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          items: JSON.stringify(items),
          shippingAddress: JSON.stringify(shippingAddress),
          totalAmount,
          status: 'PENDING',
          paymentMethod: ' WALLET'
        },
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,          // ✅ FK safe
          method: paymentMethod,      // WALLET | CARD | COD
          amount: totalAmount,
          status: 'INITIATED',
          txnRef,
          walletPhone:
            paymentMethod === 'WALLET' ? walletPhone : null,
          walletProvider:
            paymentMethod === 'WALLET' ? walletProvider : null,
        },
      });

      return { order, payment };
    });

    return res.status(201).json({
      success: true,
      order: result.order,
      payment: result.payment,
      txnRef,
    });
  } catch (err) {
    console.error('Payment error:', err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

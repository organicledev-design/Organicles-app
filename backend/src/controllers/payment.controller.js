const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const prisma = require('../prisma');
const crypto = require('crypto');

const DIALOG_BASE_URL = process.env.DIALOG_BASE_URL || 'https://checkout-ms.dev.dialog-pay.com';
const DIALOG_MERCHANT_ID = process.env.DIALOG_MERCHANT_ID;
const DIALOG_DATABASE_NAME = process.env.DIALOG_DATABASE_NAME;
const DIALOG_PAYMENT_SERVICE_ID = process.env.DIALOG_PAYMENT_SERVICE_ID;
const DIALOG_USERNAME = process.env.DIALOG_USERNAME;
const DIALOG_PASSWORD = process.env.DIALOG_PASSWORD;
const DIALOG_PRIVATE_KEY = process.env.DIALOG_PRIVATE_KEY;
const DIALOG_PUBLIC_KEY = process.env.DIALOG_PUBLIC_KEY;
const DIALOG_PAYMENT_PROVIDER_ID = process.env.DIALOG_PAYMENT_PROVIDER_ID;

function dialogAuthHeader() {
  const encoded = Buffer.from(`${DIALOG_USERNAME}:${DIALOG_PASSWORD}`).toString('base64');
  return `Basic ${encoded}`;
}

function buildSignatureHeader() {
  const dataToSign = [
    DIALOG_DATABASE_NAME,
    DIALOG_MERCHANT_ID,
    DIALOG_PAYMENT_SERVICE_ID,
    DIALOG_PASSWORD,
  ].join('|');

  const hexHash = crypto
    .createHmac('sha256', DIALOG_PRIVATE_KEY)
    .update(dataToSign)
    .digest('hex');

  return `${DIALOG_PUBLIC_KEY}:${hexHash}`;
}

async function createDialogPaySession({
  orderId,
  amount,
  currency = 'PKR',
  customer,
  products,
  successUrl,
  errorUrl,
  pendingUrl,
  notificationUrl,
}) {
  const body = {
    merchant_id: DIALOG_MERCHANT_ID,
    database_name: DIALOG_DATABASE_NAME,
    payment_service_id: DIALOG_PAYMENT_SERVICE_ID,
    ...(DIALOG_PAYMENT_PROVIDER_ID ? { payment_provider_id: DIALOG_PAYMENT_PROVIDER_ID } : {}),
    order_id: orderId,
    amount,
    currency,
    success_url: successUrl,
    error_url: errorUrl,
    pending_url: pendingUrl,
    notification_url: notificationUrl,
    customer_details: customer || {},
    products: (products || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || 'https://placehold.co/100x100.png',
    })),
  };

  // ── Debug: log exactly what we're sending to Dialog Pay ──────────────────
  console.log('=== DIALOG PAY REQUEST ===');
  console.log('URL:', `${DIALOG_BASE_URL}/api/v1/checkout/session`);
  console.log('Auth header:', dialogAuthHeader());
  console.log('Signature header:', buildSignatureHeader());
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('Env check:', {
    DIALOG_MERCHANT_ID,
    DIALOG_DATABASE_NAME,
    DIALOG_PAYMENT_SERVICE_ID,
    DIALOG_USERNAME,
    DIALOG_PASSWORD: DIALOG_PASSWORD ? '***set***' : 'MISSING',
    DIALOG_PRIVATE_KEY: DIALOG_PRIVATE_KEY ? '***set***' : 'MISSING',
    DIALOG_PUBLIC_KEY: DIALOG_PUBLIC_KEY ? '***set***' : 'MISSING',
  });
  // ─────────────────────────────────────────────────────────────────────────

  const response = await fetch(`${DIALOG_BASE_URL}/api/v1/checkout/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': dialogAuthHeader(),
      'x-signature-256': buildSignatureHeader(),
    },
    body: JSON.stringify(body),
  });

  // ── Debug: log raw response ───────────────────────────────────────────────
  const rawText = await response.text();
  console.log('=== DIALOG PAY RESPONSE ===');
  console.log('Status:', response.status, response.statusText);
  console.log('Raw body:', rawText);
  // ─────────────────────────────────────────────────────────────────────────

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (parseErr) {
    console.error('Dialog Pay response is not JSON:', rawText);
    throw new Error(`Dialog Pay invalid JSON response (status ${response.status}): ${rawText}`);
  }

  if (!response.ok || !data.is_success) {
    console.error('Dialog Pay session error:', { status: response.status, data });
    throw new Error(`Dialog Pay error ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

// ─── COD Order ────────────────────────────────────────────────────────────

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

    return res.status(201).json({ success: true, data: { order } });
  } catch (err) {
    console.error('COD order error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── Card / Wallet Order (Dialog Pay Hosted Checkout) ────────────────────

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

    // ── Debug: log exactly what the frontend sent ─────────────────────────
    console.log('=== PAYMENT REQUEST RECEIVED ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    // ─────────────────────────────────────────────────────────────────────

    if (!items || !shippingAddress || !totalAmount || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields', received: { items: !!items, shippingAddress: !!shippingAddress, totalAmount: !!totalAmount, paymentMethod: !!paymentMethod } });
    }

    const txnRef = `TXN-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          items: JSON.stringify(items),
          shippingAddress: JSON.stringify(shippingAddress),
          totalAmount,
          status: 'PENDING',
          paymentMethod,
        },
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod,
          amount: totalAmount,
          status: 'INITIATED',
          txnRef,
          walletPhone: paymentMethod === 'WALLET' ? walletPhone : null,
          walletProvider: paymentMethod === 'WALLET' ? walletProvider : null,
        },
      });

      return { order, payment };
    });

    const BASE_APP_URL = process.env.APP_URL || 'http://localhost:5000';

    const dialogSession = await createDialogPaySession({
      orderId: result.order.id.toString(),
      amount: totalAmount,
      currency: 'PKR',
      customer: {
        name: shippingAddress.fullName || '',
        email: shippingAddress.email || '',
        phone: shippingAddress.phone || '',
      },
      products: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || '',
      })),
      successUrl:      `${BASE_APP_URL}/api/payments/callback/success?orderId=${result.order.id}`,
      errorUrl:        `${BASE_APP_URL}/api/payments/callback/error?orderId=${result.order.id}`,
      pendingUrl:      `${BASE_APP_URL}/api/payments/callback/pending?orderId=${result.order.id}`,
      notificationUrl: `${BASE_APP_URL}/api/payments/callback/notify`,
    });

    const checkoutUrl =
      dialogSession?.checkout_url ||
      dialogSession?.checkoutUrl ||
      dialogSession?.data?.checkout_url ||
      dialogSession?.data?.checkoutUrl;

    if (!checkoutUrl) {
      console.error('Dialog Pay session missing checkout URL:', dialogSession);
      return res.status(502).json({
        success: false,
        message: 'Dialog Pay did not return a checkout URL',
        dialogSession,
      });
    }

    return res.status(201).json({
      success: true,
      txnRef,
      order: result.order,
      payment: result.payment,
      checkout_url: checkoutUrl,
      checkout_card_url: dialogSession?.checkout_card_url || dialogSession?.checkoutCardUrl || null,
    });

  } catch (err) {
    console.error('=== PAYMENT CONTROLLER ERROR ===');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    return res.status(500).json({ message: 'Internal server error', detail: err.message });
  }
};

// ─── Callbacks ────────────────────────────────────────────────────────────

exports.paymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.query;
    await prisma.payment.updateMany({ where: { orderId }, data: { status: 'SUCCESS' } });
    await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });
    return res.send('<h2>Payment successful! You can close this window.</h2>');
  } catch (err) {
    console.error('Success callback error:', err);
    return res.status(500).send('Error updating order');
  }
};

exports.paymentError = async (req, res) => {
  try {
    const { orderId } = req.query;
    await prisma.payment.updateMany({ where: { orderId }, data: { status: 'FAILED' } });
    await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
    return res.send('<h2>Payment failed. Please try again.</h2>');
  } catch (err) {
    console.error('Error callback error:', err);
    return res.status(500).send('Error updating order');
  }
};

exports.paymentPending = async (req, res) => {
  try {
    const { orderId } = req.query;
    await prisma.payment.updateMany({ where: { orderId }, data: { status: 'PENDING' } });
    return res.send('<h2>Payment is pending. We will notify you shortly.</h2>');
  } catch (err) {
    console.error('Pending callback error:', err);
    return res.status(500).send('Error updating order');
  }
};

exports.paymentNotify = async (req, res) => {
  console.log('Dialog Pay notification:', req.body);
  return res.status(200).json({ received: true });
};

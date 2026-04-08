const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const prisma = require('../prisma');
const crypto = require('crypto'); // built-in Node.js — no install needed

// ─── Dialog Pay config (Hosted Checkout) ───────────────────────────────────
const DIALOG_BASE_URL = process.env.DIALOG_BASE_URL || 'https://checkout-ms.dev.dialog-pay.com';
const DIALOG_MERCHANT_ID = process.env.DIALOG_MERCHANT_ID;
const DIALOG_DATABASE_NAME = process.env.DIALOG_DATABASE_NAME;
const DIALOG_PAYMENT_SERVICE_ID = process.env.DIALOG_PAYMENT_SERVICE_ID;
const DIALOG_USERNAME = process.env.DIALOG_USERNAME;
const DIALOG_PASSWORD = process.env.DIALOG_PASSWORD;
const DIALOG_PRIVATE_KEY = process.env.DIALOG_PRIVATE_KEY; // used as HMAC secret
const DIALOG_PUBLIC_KEY = process.env.DIALOG_PUBLIC_KEY;   // sent in x-signature-256 header

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Build Basic Auth header for Dialog Pay.
 * Format: Base64("username:password")
 */
function dialogAuthHeader() {
  const encoded = Buffer.from(`${DIALOG_USERNAME}:${DIALOG_PASSWORD}`).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Step 3 & 4: Compute HMAC-SHA256 signature and build x-signature-256 header.
 * dataToSign = database_name|merchant_id|payment_service_id|password
 * signature  = HMAC-SHA256(dataToSign, private_key) as hex
 * header     = "public_key:hex_hash"
 */
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

/**
 * Call Dialog Pay Hosted Checkout API.
 * Returns { checkout_url } on success.
 */
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
  // Step 1: Build JSON body
  const body = {
    merchant_id: DIALOG_MERCHANT_ID,
    database_name: DIALOG_DATABASE_NAME,
    payment_service_id: DIALOG_PAYMENT_SERVICE_ID,
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
      image: item.image || 'https://placehold.co/100x100.png', // fallback if no image
    })),
  };

  // Step 2: Basic auth header
  // Step 3 & 4: HMAC signature header
  const response = await fetch(`${DIALOG_BASE_URL}/api/v1/checkout/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': dialogAuthHeader(),       // Basic <base64(username:password)>
      'x-signature-256': buildSignatureHeader(), // public_key:hmac_hex
    },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    console.error('Dialog Pay response JSON parse error:', parseErr);
    throw new Error(`Dialog Pay invalid JSON response (status ${response.status})`);
  }

  // Step 6: Check is_success
  if (!response.ok || !data.is_success) {
    console.error('Dialog Pay session error:', {
      status: response.status,
      statusText: response.statusText,
      data,
    });
    throw new Error(
      `Dialog Pay error ${response.status}: ${JSON.stringify(data)}`
    );
  }
  return data; // { checkout_url, ... }
}

// ─── COD Order ────────────────────────────────────────────────────────────

exports.createCODOrder = async (req, res) => {
  try {
    // FIX: Accept orderId from frontend or generate if not provided
    const { orderId, items, shippingAddress, totalAmount } = req.body;

    if (!items || !shippingAddress || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const order = await prisma.order.create({
      data: {
        orderId: orderId || `ORD-${Date.now()}`, // Use provided or generate
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

// ─── Online Payment (Dialog Pay Hosted Checkout) ────────────────────

exports.createOnlinePayment = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      totalAmount,
    } = req.body;

    // ── Validation ──────────────────────────────────────────────────────
    if (!items || !shippingAddress || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ── Step 1: Save order to DB ─────────────────────────────────────────
    const txnRef = `TXN-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderId: `ORD-${Date.now()}`, // Generate unique order ID
          items: JSON.stringify(items),
          shippingAddress: JSON.stringify(shippingAddress),
          totalAmount,
          status: 'PENDING',
          paymentMethod: 'ONLINE',
        },
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          method: 'ONLINE',
          amount: totalAmount,
          status: 'INITIATED',
          txnRef,
        },
      });

      return { order, payment };
    });

    // ── Step 2: Call Dialog Pay to get checkout URL ──────────────────────
    const BASE_APP_URL = process.env.APP_URL || 'http://localhost:5000';

    const dialogSession = await createDialogPaySession({
      orderId: result.order.orderId, // Use the orderId field
      amount: totalAmount,
      currency: 'PKR',
      customer: {
        name: shippingAddress.fullName,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
      },
      products: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || '',
      })),
      successUrl: `${BASE_APP_URL}/api/payments/callback/success?orderId=${result.order.id}`,
      errorUrl:   `${BASE_APP_URL}/api/payments/callback/error?orderId=${result.order.id}`,
      pendingUrl: `${BASE_APP_URL}/api/payments/callback/pending?orderId=${result.order.id}`,
      notificationUrl: `${BASE_APP_URL}/api/payments/callback/notify`,
    });

    // ── Step 3: Return checkout URL to the app ───────────────────────────
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
      checkout_url: checkoutUrl, // App should open this URL in a WebView
    });

  } catch (err) {
    console.error('Payment error:', err);
    return res.status(500).json({ message: 'Internal server error', detail: err.message });
  }
};

// ─── Dialog Pay Callback handlers ─────────────────────────────────────────

exports.paymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.query;
    await prisma.payment.updateMany({
      where: { orderId: parseInt(orderId) },
      data: { status: 'SUCCESS' },
    });
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'CONFIRMED' },
    });
    return res.send('<h2>Payment successful! You can close this window.</h2>');
  } catch (err) {
    console.error('Success callback error:', err);
    return res.status(500).send('Error updating order');
  }
};

exports.paymentError = async (req, res) => {
  try {
    const { orderId } = req.query;
    await prisma.payment.updateMany({
      where: { orderId: parseInt(orderId) },
      data: { status: 'FAILED' },
    });
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'PAYMENT_FAILED' },
    });
    return res.send('<h2>Payment failed. Please try again.</h2>');
  } catch (err) {
    console.error('Error callback error:', err);
    return res.status(500).send('Error updating order');
  }
};

exports.paymentPending = async (req, res) => {
  try {
    const { orderId } = req.query;
    await prisma.payment.updateMany({
      where: { orderId: parseInt(orderId) },
      data: { status: 'PENDING' },
    });
    return res.send('<h2>Payment is pending. We will notify you shortly.</h2>');
  } catch (err) {
    console.error('Pending callback error:', err);
    return res.status(500).send('Error updating order');
  }
};

exports.paymentNotify = async (req, res) => {
  // Dialog Pay POSTs payment status updates here
  console.log('Dialog Pay notification:', req.body);
  // TODO: verify signature if Dialog Pay provides one
  return res.status(200).json({ received: true });
};
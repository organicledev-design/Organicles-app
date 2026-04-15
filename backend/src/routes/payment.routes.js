const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.post('/order', paymentController.createOrderAndPayment);
router.post('/cod', paymentController.createCODOrder);

// ✅ Add these callback routes
router.get('/callback/success', paymentController.paymentSuccess);
router.get('/callback/error', paymentController.paymentError);
router.get('/callback/pending', paymentController.paymentPending);
router.post('/callback/notify', paymentController.paymentNotify);

module.exports = router;
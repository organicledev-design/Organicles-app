const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Make sure ALL endpoints are exported
router.post('/payments/online', paymentController.createOnlinePayment);
router.post('/payments/cod', paymentController.createCODOrder);

// Add callback routes if needed
router.get('/payments/callback/success', paymentController.paymentSuccess);
router.get('/payments/callback/error', paymentController.paymentError);
router.get('/payments/callback/pending', paymentController.paymentPending);
router.post('/payments/callback/notify', paymentController.paymentNotify);

module.exports = router;
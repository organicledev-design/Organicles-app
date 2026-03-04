const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.post('/order', paymentController.createOrderAndPayment);


module.exports = router;

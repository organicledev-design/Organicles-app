const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');

router.post('/login', adminController.login);
router.get('/orders', adminAuth, adminController.getOrders);
router.put('/orders/:id/status', adminAuth, adminController.updateOrderStatus);
router.delete('/orders/:id', adminAuth, adminController.deleteOrder);

module.exports = router;
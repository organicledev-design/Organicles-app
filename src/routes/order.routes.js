const express = require("express");
const router = express.Router();

const { getOrders } = require("../controllers/order.controller");
const orderController = require('../controllers/order.controller');

router.get("/", getOrders);
router.post('/cod', orderController.createCODOrder);


module.exports = router;

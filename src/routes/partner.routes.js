const express = require("express");
const router = express.Router();
const partnerController = require("../controllers/partner.controller");

router.get("/", partnerController.getPartners);

module.exports = router;

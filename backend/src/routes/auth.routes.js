const express = require("express");
const { googleAuth } = require("../controllers/google.controller");

const router = express.Router();

// POST /api/auth/google
router.post("/google", googleAuth);

module.exports = router;

const express = require("express");
const { upsertProfile, getProfileByPhone } = require("../controllers/user.controller");

const router = express.Router();

router.post("/profile", upsertProfile);
router.get("/profile/:phone", getProfileByPhone);

module.exports = router;

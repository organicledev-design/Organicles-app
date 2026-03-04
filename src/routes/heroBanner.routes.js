const express = require('express');
const {
  getActiveHeroBanners,
  createHeroBanner,
} = require('../controllers/heroBanner.controller');

const router = express.Router();

router.get('/', getActiveHeroBanners);
router.post('/', createHeroBanner);

module.exports = router;

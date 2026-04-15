const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth.middleware');
const prisma = require('../prisma');

// Public — app fetches delivery fee
router.get('/delivery-fee', async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'delivery_fee' } });
    res.json({ success: true, value: Number(setting?.value || 200) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Admin — update delivery fee
router.put('/delivery-fee', adminAuth, async (req, res) => {
  try {
    const { value } = req.body;
    if (!value || isNaN(Number(value))) {
      return res.status(400).json({ success: false, message: 'Invalid value' });
    }
    const setting = await prisma.setting.upsert({
      where: { key: 'delivery_fee' },
      update: { value: String(value) },
      create: { key: 'delivery_fee', value: String(value) },
    });
    res.json({ success: true, setting });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
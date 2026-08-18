const express = require('express');
const router = express.Router();
const { getHomeSettings, updateHomeSettings } = require('../controllers/cmsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getHomeSettings)
    .put(protect, admin, updateHomeSettings);

module.exports = router;

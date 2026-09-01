export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { getMyPayouts } = require('../controllers/payoutController');

router.use(authenticate);
router.get('/', getMyPayouts);

module.exports = router;

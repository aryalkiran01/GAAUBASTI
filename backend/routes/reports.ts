export {};
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { createReport } = require('../controllers/reportController');

router.use(authenticate);
router.post('/', createReport);

module.exports = router;

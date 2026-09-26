const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protectAdmin } = require('../middleware/auth');

router.get('/', protectAdmin, getAuditLogs);

module.exports = router;

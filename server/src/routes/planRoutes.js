const express = require('express');
const router = express.Router();
const {
  getPublicPlans,
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');
const { protectAdmin } = require('../middleware/auth');

// Public routes for landing page & pass renewal
router.get('/', getPublicPlans);

// Admin protected routes
router.get('/admin', protectAdmin, getAllPlansAdmin);
router.post('/', protectAdmin, createPlan);
router.put('/:id', protectAdmin, updatePlan);
router.delete('/:id', protectAdmin, deletePlan);

module.exports = router;

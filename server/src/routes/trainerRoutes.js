const express = require('express');
const router = express.Router();
const {
  getTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} = require('../controllers/trainerController');
const { protectAdmin } = require('../middleware/auth');

// Public route to view trainers
router.get('/', getTrainers);

// Admin protected management
router.post('/', protectAdmin, createTrainer);
router.put('/:id', protectAdmin, updateTrainer);
router.delete('/:id', protectAdmin, deleteTrainer);

module.exports = router;

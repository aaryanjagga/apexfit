const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  lookupMemberPass,
} = require('../controllers/memberController');
const { protectAdmin } = require('../middleware/auth');

// Public / Member-Facing Digital Pass Lookup (No Admin Data)
router.get('/lookup/pass', lookupMemberPass);

// Admin Protected Routes
router.get('/', protectAdmin, getMembers);
router.post('/', protectAdmin, createMember);
router.get('/:id', protectAdmin, getMemberById);
router.put('/:id', protectAdmin, updateMember);
router.delete('/:id', protectAdmin, deleteMember);

module.exports = router;

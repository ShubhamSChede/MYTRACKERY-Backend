const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');
const auth = require('../middleware/auth');

// All routes are protected with authentication
router.use(auth);

// Create a new SMS transaction
router.post('/parse', smsController.createSmsTransaction);

// Get all pending transactions
router.get('/pending', smsController.getPendingTransactions);

// Approve a transaction
router.post('/approve', smsController.approveTransaction);

// Reject a transaction
router.post('/reject', smsController.rejectTransaction);

module.exports = router; 
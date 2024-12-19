const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    addJournal,
    getJournals,
    getJournalByMonth,
    updateJournal,
    deleteJournal
} = require('../controllers/journalController');

// @route   POST /api/journal
// @desc    Add a new journal entry
// @access  Private
router.post('/', auth, addJournal);

// @route   GET /api/journal
// @desc    Get all journal entries for a user
// @access  Private
router.get('/', auth, getJournals);

// @route   GET /api/journal/:monthYear
// @desc    Get journal entry for a specific month (format: YYYY-MM)
// @access  Private
router.get('/:monthYear', auth, getJournalByMonth);

// @route   PUT /api/journal/:monthYear
// @desc    Update journal entry for a specific month
// @access  Private
router.put('/:monthYear', auth, updateJournal);

// @route   DELETE /api/journal/:monthYear
// @desc    Delete journal entry for a specific month
// @access  Private
router.delete('/:monthYear', auth, deleteJournal);

module.exports = router;
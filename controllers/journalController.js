const Journal = require('../models/Journal');

exports.addJournal = async (req, res) => {
    try {
        const { monthYear, monthHighlight, skillsLearnt, productivity, health, mood } = req.body;

        // Check if journal entry already exists for this month
        const existingJournal = await Journal.findOne({
            userId: req.user.id,
            monthYear
        });

        if (existingJournal) {
            return res.status(400).json({ message: 'Journal entry already exists for this month' });
        }

        const journal = new Journal({
            userId: req.user.id,
            monthYear,
            monthHighlight,
            skillsLearnt,
            productivity,
            health,
            mood
        });

        await journal.save();
        res.json(journal);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getJournals = async (req, res) => {
    try {
        const journals = await Journal.find({ userId: req.user.id })
            .sort({ monthYear: -1 });
        res.json(journals);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getJournalByMonth = async (req, res) => {
    try {
        const journal = await Journal.findOne({
            userId: req.user.id,
            monthYear: req.params.monthYear
        });

        if (!journal) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }

        res.json(journal);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateJournal = async (req, res) => {
    try {
        const { monthHighlight, skillsLearnt, productivity, health, mood } = req.body;

        const journal = await Journal.findOne({
            userId: req.user.id,
            monthYear: req.params.monthYear
        });

        if (!journal) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }

        journal.monthHighlight = monthHighlight;
        journal.skillsLearnt = skillsLearnt;
        journal.productivity = productivity;
        journal.health = health;
        journal.mood = mood;

        await journal.save();
        res.json(journal);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteJournal = async (req, res) => {
    try {
        const journal = await Journal.findOne({
            userId: req.user.id,
            monthYear: req.params.monthYear
        });

        if (!journal) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }

        await journal.deleteOne();
        res.json({ message: 'Journal entry removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
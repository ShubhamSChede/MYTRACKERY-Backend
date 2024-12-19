const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    monthYear: {
        type: String,
        required: true,
        // Format: "YYYY-MM"
    },
    monthHighlight: {
        type: String,
        required: true
    },
    skillsLearnt: {
        type: String,
        required: true
    },
    productivity: {
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        note: {
            type: String,
            default: ''
        }
    },
    health: {
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        note: {
            type: String,
            default: ''
        }
    },
    mood: {
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        note: {
            type: String,
            default: ''
        }
    }
}, {
    timestamps: true
});

// Add a compound index to ensure one journal entry per user per month
journalSchema.index({ userId: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('Journal', journalSchema);
const mongoose = require('mongoose');

const merchantCategorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    merchantName: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique merchant-category mapping per user
merchantCategorySchema.index({ userId: 1, merchantName: 1 }, { unique: true });

module.exports = mongoose.model('MerchantCategory', merchantCategorySchema); 
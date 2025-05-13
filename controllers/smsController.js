const SmsTransaction = require('../models/SmsTransaction');
const MerchantCategory = require('../models/MerchantCategory');
const Expense = require('../models/Expense');

// Parse SMS text to extract transaction details
const parseSmsText = (smsText) => {
    // Amount patterns
    const amountPatterns = [
        /Rs\.?\s*(\d+(?:\.\d{2})?)/i,  // Rs. 500 or Rs 500
        /debited by\s*(\d+(?:\.\d{2})?)/i,  // debited by 565.0
        /debited for\s*Rs\.?\s*(\d+(?:\.\d{2})?)/i,  // debited for Rs 1.00
    ];

    // Date patterns
    const datePatterns = [
        /(\d{2}[-/]\d{2}[-/]\d{4}|\d{2}[-/]\d{2}[-/]\d{2})/,  // DD-MM-YYYY or DD-MM-YY
        /(\d{2}[A-Za-z]{3}\d{2})/,  // 25Apr25
        /(\d{2}-[A-Za-z]{3}-\d{2})/,  // 09-May-25
    ];

    // Merchant/Recipient patterns
    const merchantPatterns = [
        /([A-Z\s]+)\scredited\./i,           // ADI NILESH NAIK credited.
        /trf to\s+([A-Z\s]+?)(?=\s+P?\s*Refno|[\\.,]|$)/i,           // trf to AMOGH SHRIPAD  P Refno...
        /paid to\s+([^,]+)/i,                // paid to MERCHANT
        /sent to\s+([^,]+)/i,                // sent to MERCHANT
        /to\s+([A-Z\s]+)/i                   // fallback: to NAME (only uppercase words)
    ];

    // Find amount
    let amount = null;
    for (const pattern of amountPatterns) {
        const match = smsText.match(pattern);
        if (match) {
            amount = parseFloat(match[1]);
            break;
        }
    }

    // Find date
    let date = new Date();
    for (const pattern of datePatterns) {
        const match = smsText.match(pattern);
        if (match) {
            const dateStr = match[1];
            // Handle different date formats
            if (dateStr.includes('-')) {
                // Handle DD-MM-YY or DD-MM-YYYY
                const [day, month, year] = dateStr.split('-');
                date = new Date(
                    year.length === 2 ? `20${year}` : year,
                    month.length === 3 ? new Date(`${month} 1`).getMonth() : parseInt(month) - 1,
                    day
                );
            } else if (dateStr.match(/^\d{2}[A-Za-z]{3}\d{2}$/)) {
                // Handle 25Apr25 format
                const day = dateStr.substring(0, 2);
                const month = dateStr.substring(2, 5);
                const year = `20${dateStr.substring(5)}`;
                date = new Date(year, new Date(`${month} 1`).getMonth(), day);
            }
            break;
        }
    }

    // Find merchant/recipient
    let merchantName = null;
    for (const pattern of merchantPatterns) {
        const match = smsText.match(pattern);
        if (match) {
            merchantName = match[1].trim();
            break;
        }
    }

    return {
        amount,
        date,
        merchantName,
        smsText
    };
};

// Create a new SMS transaction
exports.createSmsTransaction = async (req, res) => {
    try {
        const { smsText } = req.body;
        const parsedData = parseSmsText(smsText);

        if (!parsedData.amount || !parsedData.merchantName) {
            return res.status(400).json({ 
                message: 'Could not parse SMS data',
                parsedData,
                smsText 
            });
        }

        // Check if we have a category mapping for this merchant
        const merchantCategory = await MerchantCategory.findOne({
            userId: req.user.id,
            merchantName: parsedData.merchantName
        });

        const smsTransaction = new SmsTransaction({
            userId: req.user.id,
            amount: parsedData.amount,
            merchantName: parsedData.merchantName,
            transactionDate: parsedData.date,
            category: merchantCategory?.category,
            smsText
        });

        await smsTransaction.save();
        res.status(201).json(smsTransaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all pending SMS transactions for a user
exports.getPendingTransactions = async (req, res) => {
    try {
        const transactions = await SmsTransaction.find({
            userId: req.user.id,
            status: 'pending'
        }).populate('category');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve a transaction and create an expense
exports.approveTransaction = async (req, res) => {
    try {
        const { transactionId, categoryId, reason } = req.body;

        const transaction = await SmsTransaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Create expense
        const expense = new Expense({
            userId: req.user.id,
            amount: transaction.amount,
            category: categoryId,
            date: transaction.transactionDate,
            description: reason || `Payment to ${transaction.merchantName}`,
            merchantName: transaction.merchantName
        });

        await expense.save();

        // Update merchant category mapping
        await MerchantCategory.findOneAndUpdate(
            {
                userId: req.user.id,
                merchantName: transaction.merchantName
            },
            {
                userId: req.user.id,
                merchantName: transaction.merchantName,
                category: categoryId
            },
            { upsert: true }
        );

        // Update transaction status
        transaction.status = 'approved';
        transaction.reason = reason;
        await transaction.save();

        res.json({ message: 'Transaction approved and expense created', expense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject a transaction
exports.rejectTransaction = async (req, res) => {
    try {
        const { transactionId, reason } = req.body;

        const transaction = await SmsTransaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        transaction.status = 'rejected';
        transaction.reason = reason;
        await transaction.save();

        res.json({ message: 'Transaction rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 
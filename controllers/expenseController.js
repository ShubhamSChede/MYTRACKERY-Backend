const Expense = require('../models/Expense');
const Category = require('../models/Category');

exports.addExpense = async (req, res) => {
  try {
    const { amount, category, reason, date } = req.body;

    // Save category if it doesn't exist
    await Category.findOneAndUpdate(
      { name: category },
      { name: category },
      { upsert: true }
    );

    const expense = new Expense({
      user: req.user.id,
      amount,
      category,
      reason,
      date: new Date(date)
    });

    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
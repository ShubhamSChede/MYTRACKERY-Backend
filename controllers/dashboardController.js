const User = require('../models/User');
const Expense = require('../models/Expense');

exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Get monthly expenditure for the current year
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          date: {
            $gte: new Date(new Date().getFullYear(), 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$date" },
          total: { $sum: "$amount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get yearly expenditure
    const yearlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: user._id
        }
      },
      {
        $group: {
          _id: { $year: "$date" },
          total: { $sum: "$amount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      user,
      monthlyExpenses,
      yearlyExpenses
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
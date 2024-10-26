// controllers/dashboardController.js
const User = require('../models/User');
const Expense = require('../models/Expense');

exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Get monthly expenditure grouped by year
    const monthlyExpensesByYear = await Expense.aggregate([
      {
        $match: {
          user: user._id
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$amount" }
        }
      },
      {
        $group: {
          _id: "$_id.year",
          months: {
            $push: {
              month: "$_id.month",
              total: "$total"
            }
          }
        }
      },
      {
        $project: {
          year: "$_id",
          months: {
            $map: {
              input: { $range: [1, 13] },
              as: "month",
              in: {
                month: "$$month",
                total: {
                  $let: {
                    vars: {
                      monthData: {
                        $filter: {
                          input: "$months",
                          as: "m",
                          cond: { $eq: ["$$m.month", "$$month"] }
                        }
                      }
                    },
                    in: {
                      $ifNull: [
                        { $arrayElemAt: ["$$monthData.total", 0] },
                        0
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $sort: { year: -1 }
      }
    ]);

    // Get yearly expenditure summary
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
        $sort: { _id: -1 }
      }
    ]);

    // Get category-wise expenditure for all time
    const categoryExpenses = await Expense.aggregate([
      {
        $match: {
          user: user._id
        }
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Get recent expenses
    const recentExpenses = await Expense.find({ user: user._id })
      .sort({ date: -1 })
      .limit(5);

    // Calculate summary statistics
    const stats = {
      totalExpenses: yearlyExpenses.reduce((acc, curr) => acc + curr.total, 0),
      avgMonthlyExpense: monthlyExpensesByYear.length > 0 
        ? (yearlyExpenses[0]?.total / monthlyExpensesByYear[0]?.months.filter(m => m.total > 0).length || 0)
        : 0,
      topCategory: categoryExpenses[0]?._id || 'No data',
      currentMonthTotal: monthlyExpensesByYear[0]?.months.find(m => m.month === new Date().getMonth() + 1)?.total || 0
    };

    res.json({
      user,
      monthlyExpensesByYear,
      yearlyExpenses,
      categoryExpenses,
      recentExpenses,
      stats
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new endpoint to get expenses for a specific year
exports.getYearExpenses = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const user = await User.findById(req.user.id).select('-password');

    // Get monthly expenditure for the specified year
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          date: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1)
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
        $project: {
          month: "$_id",
          total: 1,
          _id: 0
        }
      },
      {
        $sort: { month: 1 }
      }
    ]);

    // Get category breakdown for the year
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          date: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Calculate year statistics
    const yearTotal = monthlyExpenses.reduce((acc, curr) => acc + curr.total, 0);
    const monthsWithExpenses = monthlyExpenses.filter(m => m.total > 0).length;

    const stats = {
      yearTotal,
      avgMonthlyExpense: monthsWithExpenses > 0 ? yearTotal / monthsWithExpenses : 0,
      topCategory: categoryBreakdown[0]?._id || 'No data',
      monthsWithExpenses,
    };

    res.json({
      year,
      monthlyExpenses,
      categoryBreakdown,
      stats
    });
  } catch (err) {
    console.error('Year Expenses Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
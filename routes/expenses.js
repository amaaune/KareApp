const express = require('express');
const router = express.Router();
const {
  getAllExpenses,
  getExpenseById,
  getStats,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

// Stats first to avoid collision with /:id
router.get('/stats', getStats);
router.get('/:id', getExpenseById);
router.get('/', getAllExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getAllExpenses,
  getExpenseById,
  getExpenseStats,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

router.get('/', getAllExpenses);
router.get('/stats', getExpenseStats);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;

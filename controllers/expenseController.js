const pool = require('../db');
const { validateExpense } = require('../validators/expenseValidator');

// GET /expenses?category=X — Récupérer toutes les dépenses (optionnellement filtrées)
async function getAllExpenses(req, res) {
  const { category } = req.query;
  try {
    let result;
    if (category) {
      result = await pool.query('SELECT id, description, amount, category, date, created_at, updated_at FROM expenses WHERE category=$1 ORDER BY date DESC', [category]);
    } else {
      result = await pool.query('SELECT id, description, amount, category, date, created_at, updated_at FROM expenses ORDER BY date DESC');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /expenses/:id — détail
async function getExpenseById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, description, amount, category, date, created_at, updated_at FROM expenses WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Dépense introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /expenses/stats — totaux par catégorie
async function getStats(req, res) {
  try {
    const result = await pool.query('SELECT category, SUM(amount)::numeric(10,2) AS total FROM expenses GROUP BY category');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /expenses — Créer une nouvelle dépense
async function createExpense(req, res) {
  const payload = req.body || {};
  // accept 'description' or legacy 'label'
  payload.description = payload.description || payload.label;

  const { valid, errors } = validateExpense(payload);
  if (!valid) return res.status(400).json({ errors });

  const { description, amount, category, date } = payload;
  try {
    const result = await pool.query(
      'INSERT INTO expenses (description, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING id, description, amount, category, date, created_at, updated_at',
      [description, amount, category, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /expenses/:id — Mettre à jour une dépense
async function updateExpense(req, res) {
  const { id } = req.params;
  const payload = req.body || {};
  payload.description = payload.description || payload.label;

  const { valid, errors } = validateExpense(payload);
  if (!valid) return res.status(400).json({ errors });

  const { description, amount, category, date } = payload;
  try {
    const result = await pool.query(
      'UPDATE expenses SET description=$1, amount=$2, category=$3, date=$4, updated_at=NOW() WHERE id=$5 RETURNING id, description, amount, category, date, created_at, updated_at',
      [description, amount, category, date, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Dépense introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /expenses/:id — Supprimer une dépense
async function deleteExpense(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id=$1 RETURNING id, description, amount, category, date, created_at, updated_at', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Dépense introuvable.' });
    res.json({ message: 'Dépense supprimée.', expense: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllExpenses, getExpenseById, getStats, createExpense, updateExpense, deleteExpense };

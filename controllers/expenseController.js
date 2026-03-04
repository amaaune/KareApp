const pool = require('../db');
const { validateExpense } = require('../validators/expenseValidator');

// GET /expenses — Récupérer toutes les dépenses
async function getAllExpenses(req, res) {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /expenses — Créer une nouvelle dépense
async function createExpense(req, res) {
  const { valid, errors } = validateExpense(req.body);
  if (!valid) return res.status(400).json({ errors });

  const { label, amount, category, date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO expenses (label, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [label, amount, category, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /expenses/:id — Mettre à jour une dépense
async function updateExpense(req, res) {
  const { id } = req.params;
  const { valid, errors } = validateExpense(req.body);
  if (!valid) return res.status(400).json({ errors });

  const { label, amount, category, date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE expenses SET label=$1, amount=$2, category=$3, date=$4 WHERE id=$5 RETURNING *',
      [label, amount, category, date, id]
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
    const result = await pool.query('DELETE FROM expenses WHERE id=$1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Dépense introuvable.' });
    res.json({ message: 'Dépense supprimée.', expense: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllExpenses, createExpense, updateExpense, deleteExpense };

const pool = require('../db');
const { validateExpense } = require('../validators/expenseValidator');

// Convertit une ligne SQL en format API (ajoute description à partir de label).
function toApiExpense(expense) {
  if (!expense) return expense;
  return {
    ...expense,
    description: expense.description ?? expense.label,
  };
}

// Retourne toutes les dépenses.
// Si ?category=... est présent, retourne seulement cette catégorie.
async function getAllExpenses(req, res) {
  const { category } = req.query;
  try {
    if (category) {
      const result = await pool.query(
        'SELECT * FROM expenses WHERE category = $1 ORDER BY date DESC',
        [category]
      );
      return res.status(200).json(result.rows.map(toApiExpense));
    }

    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    return res.status(200).json(result.rows.map(toApiExpense));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Retourne une dépense précise grâce à son id.
// Renvoie 404 si elle n'existe pas.
async function getExpenseById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    return res.status(200).json(toApiExpense(result.rows[0]));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Calcule le total des montants par catégorie.
// Utile pour afficher les statistiques du budget.
async function getExpenseStats(req, res) {
  try {
    const result = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0)::float AS total
       FROM expenses
       GROUP BY category
       ORDER BY category ASC`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Crée une nouvelle dépense après validation des données.
// Accepte description en entrée et l'enregistre dans label.
async function createExpense(req, res) {
  const payload = {
    ...req.body,
    label: req.body.label ?? req.body.description,
  };
  const { valid, errors } = validateExpense(payload);
  if (!valid) return res.status(400).json({ errors });

  const { label, amount, category, date } = payload;
  try {
    const result = await pool.query(
      'INSERT INTO expenses (label, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [label, amount, category, date]
    );
    return res.status(201).json(toApiExpense(result.rows[0]));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Met à jour une dépense existante via son id.
// Renvoie 404 si l'id n'existe pas.
async function updateExpense(req, res) {
  const { id } = req.params;
  const payload = {
    ...req.body,
    label: req.body.label ?? req.body.description,
  };
  const { valid, errors } = validateExpense(payload);
  if (!valid) return res.status(400).json({ errors });

  const { label, amount, category, date } = payload;
  try {
    const result = await pool.query(
      'UPDATE expenses SET label=$1, amount=$2, category=$3, date=$4 WHERE id=$5 RETURNING *',
      [label, amount, category, date, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Expense not found' });
    return res.status(200).json(toApiExpense(result.rows[0]));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Supprime une dépense par id.
// Renvoie 204 si supprimée, 404 si introuvable.
async function deleteExpense(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id=$1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Expense not found' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getAllExpenses,
  getExpenseById,
  getExpenseStats,
  createExpense,
  updateExpense,
  deleteExpense,
};

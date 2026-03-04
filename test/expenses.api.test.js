const request = require('supertest');

// On mock la base de données pour tester l'API sans vraie connexion PostgreSQL.
jest.mock('../db', () => ({
  query: jest.fn(),
}));

// On mock le validateur pour contrôler facilement les cas valides/invalides.
jest.mock('../validators/expenseValidator', () => ({
  validateExpense: jest.fn(),
}));

const pool = require('../db');
const { validateExpense } = require('../validators/expenseValidator');
const app = require('../server');

// Suite de tests globale pour tous les endpoints /api/expenses.
describe('Expenses API', () => {
  // Nettoie les mocks avant chaque test pour éviter qu'un test influence un autre.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Teste la récupération de toutes les dépenses et le filtrage par catégorie.
  describe('GET /api/expenses', () => {
    // Cas succès: l'API renvoie la liste complète.
    it('returns all expenses', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 1, description: 'Courses', amount: '42.50', category: 'transport', date: '2026-03-01' },
        ],
      });

      const response = await request(app).get('/api/expenses');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: 1,
          description: 'Courses',
          label: 'Courses',
          amount: '42.50',
          category: 'transport',
          date: '2026-03-01',
        },
      ]);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM expenses ORDER BY date DESC');
    });

    // Cas succès: l'API filtre correctement sur la catégorie demandée.
    it('filters by category when query parameter is provided', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 2, description: 'Bus', amount: '12.00', category: 'transport', date: '2026-03-02' }],
      });

      const response = await request(app).get('/api/expenses?category=transport');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM expenses WHERE category = $1 ORDER BY date DESC',
        ['transport']
      );
    });

    it('returns 500 when database query fails', async () => {
      pool.query.mockRejectedValueOnce(new Error('db failure'));

      const response = await request(app).get('/api/expenses');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('returns 200 with an empty array when there are no expenses', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/expenses');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM expenses ORDER BY date DESC');
    });
  });

  // Teste la récupération d'une dépense par son id.
  describe('GET /api/expenses/:id', () => {
    // Cas succès: la dépense existe.
    it('returns one expense by id', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 3, description: 'Cinema', amount: '15.00', category: 'loisirs', date: '2026-03-03' }],
      });

      const response = await request(app).get('/api/expenses/3');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(3);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM expenses WHERE id = $1', ['3']);
    });

    it('returns 404 when expense does not exist', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const response = await request(app).get('/api/expenses/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Expense not found' });
    });

    it('returns 500 when database query fails', async () => {
      pool.query.mockRejectedValueOnce(new Error('db failure'));

      const response = await request(app).get('/api/expenses/3');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  // Teste les statistiques (total des montants groupés par catégorie).
  describe('GET /api/expenses/stats', () => {
    it('returns totals grouped by category', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { category: 'transport', total: 54.5 },
          { category: 'loisirs', total: 15 },
        ],
      });

      const response = await request(app).get('/api/expenses/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { category: 'transport', total: 54.5 },
        { category: 'loisirs', total: 15 },
      ]);
      expect(pool.query).toHaveBeenCalled();
    });

    it('returns 500 when database query fails', async () => {
      pool.query.mockRejectedValueOnce(new Error('db failure'));

      const response = await request(app).get('/api/expenses/stats');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('returns 200 with an empty array when there are no stats yet', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/expenses/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // Teste la création d'une dépense et la gestion des erreurs de validation.
  describe('POST /api/expenses', () => {
    // Cas succès: la création renvoie 201.
    it('creates an expense (201)', async () => {
      validateExpense.mockReturnValueOnce({ valid: true, errors: [] });
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 4,
            description: 'Restaurant',
            amount: '30.00',
            category: 'loisirs',
            date: '2026-03-04',
          },
        ],
      });

      const payload = {
        description: 'Restaurant',
        amount: 30,
        category: 'loisirs',
        date: '2026-03-04',
      };

      const response = await request(app).post('/api/expenses').send(payload);

      expect(response.status).toBe(201);
      expect(response.body.description).toBe('Restaurant');
      expect(validateExpense).toHaveBeenCalledWith(payload);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO expenses (description, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING *',
        ['Restaurant', 30, 'loisirs', '2026-03-04']
      );
    });

    it('returns 400 when validation fails', async () => {
      validateExpense.mockReturnValueOnce({ valid: false, errors: ['invalid payload'] });

      const response = await request(app).post('/api/expenses').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ errors: ['invalid payload'] });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('returns 500 when database insert fails', async () => {
      validateExpense.mockReturnValueOnce({ valid: true, errors: [] });
      pool.query.mockRejectedValueOnce(new Error('db failure'));

      const response = await request(app).post('/api/expenses').send({
        description: 'Restaurant',
        amount: 30,
        category: 'loisirs',
        date: '2026-03-04',
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  // Teste la modification d'une dépense existante et le cas introuvable.
  describe('PUT /api/expenses/:id', () => {
    // Cas succès: mise à jour OK.
    it('updates an existing expense', async () => {
      validateExpense.mockReturnValueOnce({ valid: true, errors: [] });
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 5,
            description: 'Taxi',
            amount: '20.00',
            category: 'transport',
            date: '2026-03-04',
          },
        ],
      });

      const payload = {
        description: 'Taxi',
        amount: 20,
        category: 'transport',
        date: '2026-03-04',
      };

      const response = await request(app).put('/api/expenses/5').send(payload);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Taxi');
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE expenses SET description=$1, amount=$2, category=$3, date=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
        ['Taxi', 20, 'transport', '2026-03-04', '5']
      );
    });

    it('returns 404 when updating unknown expense', async () => {
      validateExpense.mockReturnValueOnce({ valid: true, errors: [] });
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const response = await request(app).put('/api/expenses/999').send({
        description: 'Missing',
        amount: 9,
        category: 'transport',
        date: '2026-03-04',
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Expense not found' });
    });

    it('returns 400 when validation fails', async () => {
      validateExpense.mockReturnValueOnce({ valid: false, errors: ['invalid payload'] });

      const response = await request(app).put('/api/expenses/5').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ errors: ['invalid payload'] });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('returns 500 when database update fails', async () => {
      validateExpense.mockReturnValueOnce({ valid: true, errors: [] });
      pool.query.mockRejectedValueOnce(new Error('db failure'));

      const response = await request(app).put('/api/expenses/5').send({
        description: 'Taxi',
        amount: 20,
        category: 'transport',
        date: '2026-03-04',
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  // Teste la suppression d'une dépense et le cas où l'id n'existe pas.
  describe('DELETE /api/expenses/:id', () => {
    it('deletes an expense and returns 204', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 6 }] });

      const response = await request(app).delete('/api/expenses/6');

      expect(response.status).toBe(204);
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM expenses WHERE id=$1 RETURNING id', ['6']);
    });

    it('returns 404 when deleting unknown expense', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const response = await request(app).delete('/api/expenses/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Expense not found' });
    });

    it('returns 500 when database delete fails', async () => {
      pool.query.mockRejectedValueOnce(new Error('db failure'));

      const response = await request(app).delete('/api/expenses/6');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });
});

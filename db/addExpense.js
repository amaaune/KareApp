async function addExpense(db, expense) {
  const query = `
    INSERT INTO expenses (description, amount, category, date, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    expense.description,
    expense.amount,
    expense.category,
    expense.date,
  ];

  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

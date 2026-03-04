require('dotenv').config();
const express = require('express');
const expenseRoutes = require('./routes/expenses');

const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes

// Mount API under /api/expenses, keep /expenses for backward compatibility
app.use('/api/expenses', expenseRoutes);
app.use('/expenses', expenseRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'KareApp API is running' });

app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur le port ${port}`);
  });
}

module.exports = app;

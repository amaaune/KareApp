const http = require('http');

// Scalingo injecte le PORT dynamiquement, sinon on utilise 3000 en local
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello depuis Scalingo et Node.js !');
});

server.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
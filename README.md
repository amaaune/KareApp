# KareApp

Application simple de gestion de dépenses.

## Objectif

Cette API permet de :
- créer une dépense,
- lister les dépenses,
- récupérer une dépense par id,
- modifier une dépense,
- supprimer une dépense,
- filtrer par catégorie,
- afficher les statistiques par catégorie.

## Stack

- Node.js
- Express
- PostgreSQL
- Jest + Supertest (tests API)

## Installation locale

1. Installer les dépendances :

```bash
npm install
```

2. Créer le fichier `.env` depuis `.env.example`.

3. Configurer `DATABASE_URL` dans `.env`.

4. Initialiser la base avec le script SQL `db/init.sql`.

5. Lancer l'application :

```bash
npm start
```

API accessible sur `http://localhost:3000`.

## Lancer les tests

```bash
npm test
```

Le fichier de tests principal est `test/expenses.api.test.js`.

## Endpoints API

Base URL : `/api/expenses`

- `GET /api/expenses` : liste toutes les dépenses
- `GET /api/expenses?category=transport` : filtre par catégorie
- `GET /api/expenses/:id` : récupère une dépense par id
- `GET /api/expenses/stats` : total des montants par catégorie
- `POST /api/expenses` : crée une dépense
- `PUT /api/expenses/:id` : met à jour une dépense
- `DELETE /api/expenses/:id` : supprime une dépense

## Format d'une dépense

Exemple de payload (POST/PUT) :

```json
{
	"description": "Courses",
	"amount": 42.5,
	"category": "alimentaire",
	"date": "2026-03-04"
}
```

## Déploiement (Scalingo)

- Le fichier `Procfile` est configuré avec `web: npm start`.
- Ajouter les variables d'environnement sur Scalingo (`DATABASE_URL`, `NODE_ENV`).
- Déployer puis vérifier les routes API.
# Tests disponibles - KareApp

Ce document résume tous les tests actuellement présents dans le projet.

Source des tests automatisés : `test/expenses.api.test.js`.

## Résumé global

- Type de tests : tests API (Jest + Supertest)
- Total : 20 tests
- Statut attendu : tous passants
- Couverture : succès, erreurs de validation, erreurs serveur

## 1) GET /api/expenses

### Test: returns all expenses
- Vérifie que la route renvoie la liste des dépenses.
- Réponse attendue : `200`
- Corps attendu : tableau d'objets dépenses (avec `description`, `label`, `amount`, `category`, `date`).

### Test: filters by category when query parameter is provided
- Vérifie le filtre `?category=transport`.
- Réponse attendue : `200`
- Corps attendu : tableau filtré.

### Test: returns 500 when database query fails
- Vérifie la gestion d'une erreur SQL.
- Réponse attendue : `500`
- Corps attendu : `{ "error": "Internal server error" }`

### Test: returns 200 with an empty array when there are no expenses
- Vérifie le cas sans données.
- Réponse attendue : `200`
- Corps attendu : `[]`

## 2) GET /api/expenses/:id

### Test: returns one expense by id
- Vérifie la récupération d'une dépense existante.
- Réponse attendue : `200`
- Corps attendu : objet dépense.

### Test: returns 404 when expense does not exist
- Vérifie le cas ID introuvable.
- Réponse attendue : `404`
- Corps attendu : `{ "error": "Expense not found" }`

### Test: returns 500 when database query fails
- Vérifie la gestion d'une erreur SQL.
- Réponse attendue : `500`
- Corps attendu : `{ "error": "Internal server error" }`

## 3) GET /api/expenses/stats

### Test: returns totals grouped by category
- Vérifie les statistiques par catégorie.
- Réponse attendue : `200`
- Corps attendu : tableau, exemple:
  - `{ "category": "transport", "total": 54.5 }`

### Test: returns 500 when database query fails
- Vérifie la gestion d'une erreur SQL.
- Réponse attendue : `500`
- Corps attendu : `{ "error": "Internal server error" }`

### Test: returns 200 with an empty array when there are no stats yet
- Vérifie le cas sans données.
- Réponse attendue : `200`
- Corps attendu : `[]`

## 4) POST /api/expenses

### Test: creates an expense (201)
- Vérifie la création d'une dépense valide.
- Réponse attendue : `201`
- Corps attendu : objet créé (avec `description` notamment).

### Test: returns 400 when validation fails
- Vérifie le rejet d'un payload invalide.
- Réponse attendue : `400`
- Corps attendu : `{ "errors": [ ... ] }`

### Test: returns 500 when database insert fails
- Vérifie la gestion d'une erreur SQL lors de l'insert.
- Réponse attendue : `500`
- Corps attendu : `{ "error": "Internal server error" }`

## 5) PUT /api/expenses/:id

### Test: updates an existing expense
- Vérifie la mise à jour d'une dépense existante.
- Réponse attendue : `200`
- Corps attendu : objet dépense mis à jour.

### Test: returns 404 when updating unknown expense
- Vérifie le cas ID introuvable.
- Réponse attendue : `404`
- Corps attendu : `{ "error": "Expense not found" }`

### Test: returns 400 when validation fails
- Vérifie le rejet d'un payload invalide.
- Réponse attendue : `400`
- Corps attendu : `{ "errors": [ ... ] }`

### Test: returns 500 when database update fails
- Vérifie la gestion d'une erreur SQL lors de l'update.
- Réponse attendue : `500`
- Corps attendu : `{ "error": "Internal server error" }`

## 6) DELETE /api/expenses/:id

### Test: deletes an expense and returns 204
- Vérifie la suppression d'une dépense existante.
- Réponse attendue : `204`
- Corps attendu : vide.

### Test: returns 404 when deleting unknown expense
- Vérifie le cas ID introuvable.
- Réponse attendue : `404`
- Corps attendu : `{ "error": "Expense not found" }`

### Test: returns 500 when database delete fails
- Vérifie la gestion d'une erreur SQL lors du delete.
- Réponse attendue : `500`
- Corps attendu : `{ "error": "Internal server error" }`

---

## Tests manuels recommandés (site/frontend)

Ces tests ne sont pas automatisés dans Jest, mais utiles pour vérifier le comportement utilisateur:

1. Ajouter une dépense valide depuis le formulaire
- Action: remplir le formulaire et cliquer Ajouter.
- Résultat attendu: la ligne apparaît dans la table, total mis à jour, pas d'erreur.

2. Ajouter une dépense invalide
- Action: montant vide ou <= 0, date invalide, catégorie absente.
- Résultat attendu: message d'erreur visible, aucune création.

3. Modifier une dépense
- Action: cliquer Modifier, changer montant/description, enregistrer.
- Résultat attendu: ligne mise à jour, total recalculé.

4. Supprimer une dépense
- Action: cliquer Supprimer et confirmer.
- Résultat attendu: ligne retirée, total recalculé.

5. Filtrer par catégorie
- Action: cliquer sur un filtre (transport, loisirs, etc.).
- Résultat attendu: seules les dépenses de la catégorie sont affichées.

6. Vérifier les stats
- Action: regarder le bloc de totaux par catégorie.
- Résultat attendu: montants cohérents avec les dépenses visibles en base.

7. Cas liste vide
- Action: supprimer toutes les dépenses.
- Résultat attendu: message "Aucune dépense" + totaux à 0.

---

## Comment lancer les tests automatisés

Depuis le dossier KareApp:

```bash
npm test
```

Résultat attendu:
- 1 suite de tests passante
- 20 tests passants

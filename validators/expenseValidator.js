const VALID_CATEGORIES = ['alimentaire', 'transport', 'logement', 'sante', 'loisirs', 'autre'];

// Retourne le texte principal de la dépense.
// On accepte "description" (contrat métier) et "label" (compatibilité existante).
function getExpenseText(data) {
  return (data.description ?? data.label ?? '').toString().trim();
}

/**
 * Valide les champs d'une dépense.
 * @param {object} data - Les données à valider
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateExpense(data) {
  const errors = [];
  const expenseText = getExpenseText(data);

  // Vérifie qu'on a un texte non vide pour décrire la dépense.
  if (!expenseText) {
    errors.push('Le champ "description" est requis et doit être une chaîne non vide.');
  }

  // Limite la taille de la description à 200 caractères.
  if (expenseText.length > 200) {
    errors.push('Le champ "description" ne doit pas dépasser 200 caractères.');
  }

  // Vérifie que le montant est un nombre strictement positif.
  if (data.amount === undefined || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.push('Le champ "amount" est requis et doit être un nombre positif.');
  }

  // Vérifie que la catégorie fait partie des catégories autorisées.
  if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`Le champ "category" doit être l'une des valeurs suivantes : ${VALID_CATEGORIES.join(', ')}.`);
  }

  // Vérifie qu'une date valide est fournie (format ISO attendu côté front/API).
  if (!data.date || isNaN(Date.parse(data.date))) {
    errors.push('Le champ "date" est requis et doit être une date valide (YYYY-MM-DD).');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateExpense, VALID_CATEGORIES };

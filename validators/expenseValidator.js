const VALID_CATEGORIES = ['alimentaire', 'transport', 'loisirs', 'autre'];

/**
 * Valide les champs d'une dépense.
 * @param {object} data - Les données à valider
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateExpense(data) {
  const errors = [];

  const desc = data.description || data.label;
  if (!desc || typeof desc !== 'string' || desc.trim() === '') {
    errors.push('Le champ "description" est requis et doit être une chaîne non vide.');
  } else if (desc.length > 200) {
    errors.push('Le champ "description" doit contenir au maximum 200 caractères.');
  }

  if (data.amount === undefined || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.push('Le champ "amount" est requis et doit être un nombre positif.');
  }

  if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`Le champ "category" doit être l'une des valeurs suivantes : ${VALID_CATEGORIES.join(', ')}.`);
  }

  if (!data.date || isNaN(Date.parse(data.date))) {
    errors.push('Le champ "date" est requis et doit être une date valide (YYYY-MM-DD).');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateExpense, VALID_CATEGORIES };

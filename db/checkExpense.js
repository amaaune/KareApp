function validateExpense(expense) {
  const errors = [];

  // Liste des catégories autorisées
  const allowedCategories = ["Food", "Transport", "Housing", "Entertainment", "Health", "Other"];

  // 🔹 Description
  if (!expense.description || typeof expense.description !== "string") {
    errors.push("La description est obligatoire.");
  } else if (expense.description.length > 200) {
    errors.push("La description ne doit pas dépasser 200 caractères.");
  }

  // 🔹 Amount
  if (expense.amount === undefined || expense.amount === null) {
    errors.push("Le montant est obligatoire.");
  } else if (typeof expense.amount !== "number" || isNaN(expense.amount)) {
    errors.push("Le montant doit être un nombre.");
  } else if (expense.amount <= 0) {
    errors.push("Le montant doit être supérieur à 0.");
  }

  // 🔹 Category
  if (!expense.category || typeof expense.category !== "string") {
    errors.push("La catégorie est obligatoire.");
  } else if (!allowedCategories.includes(expense.category)) {
    errors.push("Catégorie non autorisée.");
  }

  // 🔹 Date
  if (!expense.date) {
    errors.push("La date est obligatoire.");
  } else {
    const date = new Date(expense.date);
    if (isNaN(date.getTime())) {
      errors.push("La date n'est pas valide.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

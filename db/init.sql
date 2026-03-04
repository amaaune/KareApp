CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  description VARCHAR(200) NOT NULL,
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category    VARCHAR(100) NOT NULL,
  date        DATE NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Compatibilité: ajoute les colonnes manquantes si la table existait déjà.
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS description VARCHAR(200);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Migration: si l'ancien champ "label" existe, copie sa valeur vers "description".
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'label'
  ) THEN
    UPDATE expenses
    SET description = COALESCE(description, label)
    WHERE description IS NULL;
  END IF;
END $$;

-- Finalisation: rend description obligatoire une fois la migration faite.
ALTER TABLE expenses
  ALTER COLUMN description SET NOT NULL;

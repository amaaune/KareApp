DO $$
BEGIN
  -- Rename label -> description if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='expenses' AND column_name='label'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='expenses' AND column_name='description'
  ) THEN
    ALTER TABLE expenses RENAME COLUMN label TO description;
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='expenses' AND column_name='updated_at'
  ) THEN
    ALTER TABLE expenses ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;

  -- Ensure description length
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='expenses' AND column_name='description'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE expenses ALTER COLUMN description TYPE VARCHAR(200)';
    EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;
  END IF;

  -- Ensure amount type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='expenses' AND column_name='amount'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE expenses ALTER COLUMN amount TYPE NUMERIC(10,2)';
    EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;
  END IF;

  -- Add CHECK constraint for amount > 0 if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='chk_amount_positive'
  ) THEN
    BEGIN
      ALTER TABLE expenses ADD CONSTRAINT chk_amount_positive CHECK (amount > 0);
    EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;
  END IF;

  -- Ensure date is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='expenses' AND column_name='date'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE expenses ALTER COLUMN date SET NOT NULL';
    EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function if missing
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at ON expenses;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

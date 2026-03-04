CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  description VARCHAR(200) NOT NULL,
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category    VARCHAR(50) NOT NULL,
  date        DATE NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Trigger to update updated_at on row modification
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

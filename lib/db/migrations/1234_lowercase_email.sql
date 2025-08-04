-- 1️⃣ Function to lowercase email before insert/update
CREATE OR REPLACE FUNCTION lowercase_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2️⃣ Create trigger on waitlist table
CREATE TRIGGER trg_lowercase_email
BEFORE INSERT OR UPDATE ON waitlist
FOR EACH ROW
EXECUTE FUNCTION lowercase_email();

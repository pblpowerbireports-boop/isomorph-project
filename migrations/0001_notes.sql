-- Notes table for the starter. Ownership comes from the Isomorph gateway's transaction-local
-- settings (harbour.user_id / harbour.user_email); the browser never supplies it.
CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  owner_subject TEXT NOT NULL DEFAULT current_setting('harbour.user_id', true),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notes_owner ON notes;
CREATE POLICY notes_owner ON notes
  USING (owner_subject = current_setting('harbour.user_id', true))
  WITH CHECK (owner_subject = current_setting('harbour.user_id', true));

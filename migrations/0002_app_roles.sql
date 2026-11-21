-- Who does what in this app. `role` is the app's own word ("approver", "viewer");
-- whoever built or shares the app (harbour.user_role = 'builder') sets it from the Setup card.
CREATE TABLE IF NOT EXISTS app_roles (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (char_length(role) BETWEEN 1 AND 100),
  granted_by TEXT NOT NULL DEFAULT current_setting('harbour.user_email', true)
);
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_roles_read ON app_roles;
CREATE POLICY app_roles_read ON app_roles FOR SELECT
  USING (email = current_setting('harbour.user_email', true) OR (SELECT current_setting('harbour.user_role', true) = 'builder'));
DROP POLICY IF EXISTS app_roles_add ON app_roles;
CREATE POLICY app_roles_add ON app_roles FOR INSERT
  WITH CHECK ((SELECT current_setting('harbour.user_role', true) = 'builder'));
DROP POLICY IF EXISTS app_roles_change ON app_roles;
CREATE POLICY app_roles_change ON app_roles FOR UPDATE
  USING ((SELECT current_setting('harbour.user_role', true) = 'builder'))
  WITH CHECK ((SELECT current_setting('harbour.user_role', true) = 'builder'));
DROP POLICY IF EXISTS app_roles_remove ON app_roles;
CREATE POLICY app_roles_remove ON app_roles FOR DELETE
  USING ((SELECT current_setting('harbour.user_role', true) = 'builder'));

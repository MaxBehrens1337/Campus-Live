-- ============================================================================
-- RESET: Drop all existing Campus tables and types
-- Run this FIRST if you get "already exists" errors
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;



-- Drop tables (reverse dependency order)
DROP TABLE IF EXISTS import_protokoll CASCADE;
DROP TABLE IF EXISTS redaktionelle_notizen CASCADE;
DROP TABLE IF EXISTS quiz_antworten CASCADE;
DROP TABLE IF EXISTS quiz_versuche CASCADE;
DROP TABLE IF EXISTS lernfortschritt CASCADE;
DROP TABLE IF EXISTS antwortoptionen CASCADE;
DROP TABLE IF EXISTS fragen CASCADE;
DROP TABLE IF EXISTS quizze CASCADE;
DROP TABLE IF EXISTS inhaltsbloecke CASCADE;
DROP TABLE IF EXISTS lektionen CASCADE;
DROP TABLE IF EXISTS kurse CASCADE;
DROP TABLE IF EXISTS medien_assets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop old tables from previous schema (if any)
DROP TABLE IF EXISTS einschreibungen CASCADE;
DROP TABLE IF EXISTS haendler CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_geaendert_am();
DROP FUNCTION IF EXISTS is_admin_or_editor();
DROP FUNCTION IF EXISTS is_admin();

-- Drop enums
DROP TYPE IF EXISTS rollen_typ CASCADE;
DROP TYPE IF EXISTS kurs_status CASCADE;
DROP TYPE IF EXISTS lektion_status CASCADE;
DROP TYPE IF EXISTS quell_status CASCADE;
DROP TYPE IF EXISTS block_typ CASCADE;
DROP TYPE IF EXISTS frage_typ CASCADE;
DROP TYPE IF EXISTS option_typ CASCADE;
DROP TYPE IF EXISTS medien_typ CASCADE;
DROP TYPE IF EXISTS fortschritt_status CASCADE;
DROP TYPE IF EXISTS notiz_schwere CASCADE;
DROP TYPE IF EXISTS notiz_status CASCADE;

-- Also drop old enums from previous schema
DROP TYPE IF EXISTS inhalt_status CASCADE;

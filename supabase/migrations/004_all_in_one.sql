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
-- ============================================================================
-- THITRONIK Campus Academy – Schema Migration
-- ============================================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE rollen_typ AS ENUM ('admin', 'editor', 'trainer', 'lernender');
CREATE TYPE kurs_status AS ENUM ('entwurf', 'veroeffentlicht', 'archiviert');
CREATE TYPE lektion_status AS ENUM ('entwurf', 'veroeffentlicht', 'archiviert');
CREATE TYPE quell_status AS ENUM ('vollstaendig', 'unvollstaendig', 'medien_fehlen', 'redaktion_pruefen');
CREATE TYPE block_typ AS ENUM ('text', 'bild', 'video', 'pdf', 'hinweis', 'schritte', 'quiz_verweis');
CREATE TYPE frage_typ AS ENUM ('single', 'multiple', 'bild');
CREATE TYPE option_typ AS ENUM ('text', 'bild', 'bild_mit_text', 'platzhalter');
CREATE TYPE medien_typ AS ENUM ('bild', 'video', 'pdf', 'dokument', 'poster');
CREATE TYPE fortschritt_status AS ENUM ('nicht_gestartet', 'in_bearbeitung', 'abgeschlossen');
CREATE TYPE notiz_schwere AS ENUM ('info', 'warnung', 'kritisch');
CREATE TYPE notiz_status AS ENUM ('offen', 'in_bearbeitung', 'erledigt');

-- ── Profiles ────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rolle         rollen_typ NOT NULL DEFAULT 'lernender',
  anzeigename   TEXT,
  firma         TEXT,
  kundennummer  TEXT UNIQUE,
  locale        TEXT NOT NULL DEFAULT 'de',
  aktiv         BOOLEAN NOT NULL DEFAULT true,
  erstellt_am   TIMESTAMPTZ NOT NULL DEFAULT now(),
  geaendert_am  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, anzeigename)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Medien Assets ───────────────────────────────────────────────────────────

CREATE TABLE medien_assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_pfad      TEXT,
  medien_typ        medien_typ NOT NULL DEFAULT 'bild',
  titel             TEXT,
  alt_text          TEXT,
  poster_pfad       TEXT,
  platzhalter       BOOLEAN NOT NULL DEFAULT false,
  quell_datei       TEXT,
  quell_status      quell_status NOT NULL DEFAULT 'vollstaendig',
  metadaten         JSONB DEFAULT '{}',
  erstellt_am       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Kurse (Modules) ─────────────────────────────────────────────────────────

CREATE TABLE kurse (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  titel             TEXT NOT NULL,
  untertitel        TEXT,
  beschreibung      TEXT,
  bild_url          TEXT,
  status            kurs_status NOT NULL DEFAULT 'entwurf',
  quell_status      quell_status NOT NULL DEFAULT 'vollstaendig',
  quell_datei       TEXT,
  fragen_anzahl     INT NOT NULL DEFAULT 0,
  hat_video         BOOLEAN NOT NULL DEFAULT false,
  hat_bilder        BOOLEAN NOT NULL DEFAULT false,
  reihenfolge       INT NOT NULL DEFAULT 0,
  erstellt_am       TIMESTAMPTZ NOT NULL DEFAULT now(),
  geaendert_am      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Lektionen (Lessons) ─────────────────────────────────────────────────────

CREATE TABLE lektionen (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kurs_id           UUID NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,
  slug              TEXT,
  titel             TEXT NOT NULL,
  beschreibung      TEXT,
  lektion_typ       TEXT DEFAULT 'standard',
  status            lektion_status NOT NULL DEFAULT 'entwurf',
  quell_status      quell_status NOT NULL DEFAULT 'vollstaendig',
  reihenfolge       INT NOT NULL DEFAULT 0,
  dauer_min         INT,
  version           TEXT DEFAULT '1.0',
  zielgruppe        TEXT,
  erstellt_am       TIMESTAMPTZ NOT NULL DEFAULT now(),
  geaendert_am      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lektionen_kurs ON lektionen(kurs_id);

-- ── Inhaltsblöcke (Lesson Content Blocks) ───────────────────────────────────

CREATE TABLE inhaltsbloecke (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lektion_id        UUID NOT NULL REFERENCES lektionen(id) ON DELETE CASCADE,
  typ               block_typ NOT NULL DEFAULT 'text',
  ueberschrift      TEXT,
  inhalt            TEXT,
  media_asset_id    UUID REFERENCES medien_assets(id) ON DELETE SET NULL,
  metadaten         JSONB DEFAULT '{}',
  reihenfolge       INT NOT NULL DEFAULT 0,
  erstellt_am       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bloecke_lektion ON inhaltsbloecke(lektion_id);

-- ── Quizze ──────────────────────────────────────────────────────────────────

CREATE TABLE quizze (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lektion_id        UUID NOT NULL REFERENCES lektionen(id) ON DELETE CASCADE,
  titel             TEXT NOT NULL,
  modus             TEXT NOT NULL DEFAULT 'sofort',
  mindestquote      INT NOT NULL DEFAULT 70,
  zufallsreihenfolge BOOLEAN NOT NULL DEFAULT false,
  erstellt_am       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quizze_lektion ON quizze(lektion_id);

-- ── Fragen ──────────────────────────────────────────────────────────────────

CREATE TABLE fragen (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           UUID NOT NULL REFERENCES quizze(id) ON DELETE CASCADE,
  typ               frage_typ NOT NULL DEFAULT 'single',
  fragetext         TEXT NOT NULL,
  erklaerung        TEXT,
  media_id          UUID REFERENCES medien_assets(id) ON DELETE SET NULL,
  reihenfolge       INT NOT NULL DEFAULT 0,
  mehrere_korrekt   BOOLEAN NOT NULL DEFAULT false,
  inhalt_status     quell_status NOT NULL DEFAULT 'vollstaendig',
  quell_datei       TEXT,
  notizen_redaktion TEXT,
  erstellt_am       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fragen_quiz ON fragen(quiz_id);

-- ── Antwortoptionen ─────────────────────────────────────────────────────────

CREATE TABLE antwortoptionen (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frage_id          UUID NOT NULL REFERENCES fragen(id) ON DELETE CASCADE,
  text              TEXT,
  option_typ        option_typ NOT NULL DEFAULT 'text',
  media_asset_id    UUID REFERENCES medien_assets(id) ON DELETE SET NULL,
  ist_korrekt       BOOLEAN NOT NULL DEFAULT false,
  reihenfolge       INT NOT NULL DEFAULT 0,
  quell_status      quell_status NOT NULL DEFAULT 'vollstaendig',
  erstellt_am       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_antworten_frage ON antwortoptionen(frage_id);

-- ── Lernfortschritt ─────────────────────────────────────────────────────────

CREATE TABLE lernfortschritt (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lektion_id        UUID NOT NULL REFERENCES lektionen(id) ON DELETE CASCADE,
  status            fortschritt_status NOT NULL DEFAULT 'nicht_gestartet',
  prozent           INT NOT NULL DEFAULT 0,
  abgeschlossen_am  TIMESTAMPTZ,
  UNIQUE(user_id, lektion_id)
);

CREATE INDEX idx_fortschritt_user ON lernfortschritt(user_id);

-- ── Quiz-Versuche ───────────────────────────────────────────────────────────

CREATE TABLE quiz_versuche (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id           UUID NOT NULL REFERENCES quizze(id) ON DELETE CASCADE,
  gestartet_am      TIMESTAMPTZ NOT NULL DEFAULT now(),
  abgeschlossen_am  TIMESTAMPTZ,
  punkte            INT,
  max_punkte        INT,
  bestanden         BOOLEAN
);

CREATE INDEX idx_versuche_user ON quiz_versuche(user_id);

-- ── Quiz-Antworten ──────────────────────────────────────────────────────────

CREATE TABLE quiz_antworten (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versuch_id        UUID NOT NULL REFERENCES quiz_versuche(id) ON DELETE CASCADE,
  frage_id          UUID NOT NULL REFERENCES fragen(id) ON DELETE CASCADE,
  antwort_option_id UUID REFERENCES antwortoptionen(id) ON DELETE SET NULL,
  ist_korrekt       BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_quiz_antworten_versuch ON quiz_antworten(versuch_id);

-- ── Redaktionelle Notizen ───────────────────────────────────────────────────

CREATE TABLE redaktionelle_notizen (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitaet_typ      TEXT NOT NULL,  -- 'kurs', 'lektion', 'frage', 'antwortoption', 'medien_asset'
  entitaet_id       UUID NOT NULL,
  typ               TEXT NOT NULL DEFAULT 'hinweis',  -- hinweis, fehler, todo
  schwere           notiz_schwere NOT NULL DEFAULT 'info',
  status            notiz_status NOT NULL DEFAULT 'offen',
  notiz             TEXT NOT NULL,
  erstellt_von      UUID REFERENCES auth.users(id),
  erstellt_am       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notizen_entitaet ON redaktionelle_notizen(entitaet_typ, entitaet_id);

-- ── Import-Protokoll ────────────────────────────────────────────────────────

CREATE TABLE import_protokoll (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quell_datei       TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'laufend',
  bericht           JSONB DEFAULT '{}',
  importiert_am     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Updated-at Trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_geaendert_am()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geaendert_am = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_geaendert_am();

CREATE TRIGGER trg_kurse_updated
  BEFORE UPDATE ON kurse FOR EACH ROW EXECUTE FUNCTION update_geaendert_am();

CREATE TRIGGER trg_lektionen_updated
  BEFORE UPDATE ON lektionen FOR EACH ROW EXECUTE FUNCTION update_geaendert_am();

-- ── Legacy compatibility view ───────────────────────────────────────────────
-- The existing code references "haendler" table. This view provides compatibility.

CREATE OR REPLACE VIEW haendler AS
SELECT
  p.id,
  p.kundennummer,
  p.firma AS firmenname,
  p.anzeigename AS vorname,
  NULL::text AS nachname,
  u.email,
  p.rolle::text AS rolle,
  p.aktiv,
  p.erstellt_am
FROM profiles p
JOIN auth.users u ON u.id = p.id;
-- ============================================================================
-- THITRONIK Campus Academy – Row Level Security Policies
-- ============================================================================
-- Run AFTER 001_schema.sql in the Supabase SQL Editor
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medien_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurse ENABLE ROW LEVEL SECURITY;
ALTER TABLE lektionen ENABLE ROW LEVEL SECURITY;
ALTER TABLE inhaltsbloecke ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizze ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragen ENABLE ROW LEVEL SECURITY;
ALTER TABLE antwortoptionen ENABLE ROW LEVEL SECURITY;
ALTER TABLE lernfortschritt ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_versuche ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_antworten ENABLE ROW LEVEL SECURITY;
ALTER TABLE redaktionelle_notizen ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_protokoll ENABLE ROW LEVEL SECURITY;

-- ── Helper: Check if current user has admin/editor role ─────────────────────

CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND rolle IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND rolle = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── Profiles ────────────────────────────────────────────────────────────────

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (is_admin());

-- ── Kurse (public read for published, admin full) ───────────────────────────

CREATE POLICY "Published kurse are public"
  ON kurse FOR SELECT
  USING (status = 'veroeffentlicht');

CREATE POLICY "Admins/editors manage kurse"
  ON kurse FOR ALL
  USING (is_admin_or_editor());

-- ── Lektionen ───────────────────────────────────────────────────────────────

CREATE POLICY "Published lektionen are public"
  ON lektionen FOR SELECT
  USING (status = 'veroeffentlicht');

CREATE POLICY "Admins/editors manage lektionen"
  ON lektionen FOR ALL
  USING (is_admin_or_editor());

-- ── Inhaltsblöcke ───────────────────────────────────────────────────────────

CREATE POLICY "Authenticated users can read blocks"
  ON inhaltsbloecke FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins/editors manage blocks"
  ON inhaltsbloecke FOR ALL
  USING (is_admin_or_editor());

-- ── Quizze ──────────────────────────────────────────────────────────────────

CREATE POLICY "Authenticated users can read quizze"
  ON quizze FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins/editors manage quizze"
  ON quizze FOR ALL
  USING (is_admin_or_editor());

-- ── Fragen ──────────────────────────────────────────────────────────────────

CREATE POLICY "Authenticated users can read fragen"
  ON fragen FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins/editors manage fragen"
  ON fragen FOR ALL
  USING (is_admin_or_editor());

-- ── Antwortoptionen ─────────────────────────────────────────────────────────

CREATE POLICY "Authenticated users can read antwortoptionen"
  ON antwortoptionen FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins/editors manage antwortoptionen"
  ON antwortoptionen FOR ALL
  USING (is_admin_or_editor());

-- ── Medien Assets ───────────────────────────────────────────────────────────

CREATE POLICY "Anyone can read medien_assets"
  ON medien_assets FOR SELECT
  USING (true);

CREATE POLICY "Admins/editors manage medien_assets"
  ON medien_assets FOR ALL
  USING (is_admin_or_editor());

-- ── Lernfortschritt (user-scoped) ───────────────────────────────────────────

CREATE POLICY "Users manage own fortschritt"
  ON lernfortschritt FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all fortschritt"
  ON lernfortschritt FOR SELECT
  USING (is_admin());

-- ── Quiz-Versuche (user-scoped) ─────────────────────────────────────────────

CREATE POLICY "Users manage own quiz_versuche"
  ON quiz_versuche FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all quiz_versuche"
  ON quiz_versuche FOR SELECT
  USING (is_admin());

-- ── Quiz-Antworten ──────────────────────────────────────────────────────────

CREATE POLICY "Users read own quiz_antworten"
  ON quiz_antworten FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_versuche v
      WHERE v.id = quiz_antworten.versuch_id
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own quiz_antworten"
  ON quiz_antworten FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_versuche v
      WHERE v.id = quiz_antworten.versuch_id
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins read all quiz_antworten"
  ON quiz_antworten FOR SELECT
  USING (is_admin());

-- ── Redaktionelle Notizen (admin/editor only) ───────────────────────────────

CREATE POLICY "Admins/editors manage notizen"
  ON redaktionelle_notizen FOR ALL
  USING (is_admin_or_editor());

-- ── Import-Protokoll (admin only) ───────────────────────────────────────────

CREATE POLICY "Admins manage import_protokoll"
  ON import_protokoll FOR ALL
  USING (is_admin());

-- ── Storage Policies ────────────────────────────────────────────────────────
-- Note: Storage bucket policies are configured in the Supabase Dashboard.
-- Recommended bucket setup:
--   Bucket: "campus-medien"
--   Public: true (for published assets)
--   Upload: admin/editor roles only (via RLS or service role)
-- ============================================================================
-- THITRONIK Campus Academy ��� Doinstruct Content Seed
-- ============================================================================
-- Auto-generated from TypeScript seed data.
-- Generated: 2026-03-30T18:24:54.495Z
-- Module count: 13
-- Total questions: 72
-- ============================================================================

BEGIN;

-- ������ Import protocol entry ������������������������������������������������������������������������������������������������������������������������������������������������
INSERT INTO import_protokoll (quell_datei, status, bericht) VALUES ('doinstruct-gesamt', 'abgeschlossen', '{"module": 13, "fragen": 72}');

-- ������ Module 1: Allgemeine Fragen ������
DO $$ DECLARE kurs_1 UUID; lektion_1 UUID; quiz_1 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('allgemeinefragen', 'Allgemeine Fragen', 'Grundlegende Fragen rund um den Einbau und die Handhabung von THITRONIK Produkten.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-allgemeinefragen', 5, false, false, 10)
  RETURNING id INTO kurs_1;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_1, 'allgemeinefragen-quiz', 'Allgemeine Fragen ��� Quiz', 'Wissenstest: Allgemeine Fragen', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_1;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_1, 'Allgemeine Fragen Quiz', 'sofort', 70)
  RETURNING id INTO quiz_1;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_1, 'single', 'Woher wei+� ich, wie lange ich f++r den Einbau der THITRONIK Produkte ben+�tige?', 10, false, 'vollstaendig', 'doinstruct-allgemeinefragen', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Einbaurichtzeiten finde ich auf der THITRONIK Website im H+�ndler-Bereich.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich frage einen Kollegen, der so etwas schon einmal gemacht hat.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich plane erst einmal einen ganzen Tag ein und freue mich, wenn es schneller geht.', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_1, 'single', 'Wie l+�sst sich die Fahrzeugannahme/-++bergabe zu einem angenehmen Erlebnis f++r alle Beteiligten machen?', 20, false, 'vollstaendig', 'doinstruct-allgemeinefragen', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich verwende die THITRONIK Arbeitskarte, um alle f++r die Fahrzeug++bergabe wichtigen Punkte systematisch abzuarbeiten und zu dokumentieren.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Kladde und Stift reichen v+�llig aus.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich muss mir nichts aufschreiben; ich kann mir das alles einfach so merken.', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich gestalte die Fahrzeugannahme/-++bergabe nach Gef++hl und hoffe am Ende, dass ich nichts vergessen habe.', 'text', false, 40, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_1, 'single', 'Woher wei+� ich, ob ich beim vorliegenden Fahrzeug eine Zusatzhupe/Backup-Sirene verbauen muss?', 30, false, 'vollstaendig', 'doinstruct-allgemeinefragen', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich w+�hle das Fahrzeug im THITRONIK Konfigurator aus und erg+�nze das Produkt WiPro III safe.lock. Ist eine Zusatzhupe/Backup-Sirene erforderlich, werde ich dar++ber im Konfigurator informiert.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich frage meine Kollegen, die schon einmal ein Alarmsystem in so ein Fahrzeug eingebaut haben.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Jedes Fahrzeug, in das eine WiPro III safe.lock eingebaut wird, ben+�tigt auch eine Zusatzhupe oder Backup-Sirene.', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich baue erst einmal eine WiPro III safe.lock ein, teste dann die Alarmfunktion und entscheide, ob der Alarm ohne Zusatzhupe/Backup-Sirene laut genug ist.', 'text', false, 40, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_1, 'single', 'Wo wird die Status-LED angebracht?', 40, false, 'vollstaendig', 'doinstruct-allgemeinefragen', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'In den Einbauunterlagen zum jeweiligen Fahrzeug ist ein empfohlener Einbauort dokumentiert; man sollte aber immer vorab mit dem Kunden kl+�ren, ob es andere W++nsche gibt und dies ggf. auf der Arbeitskarte notieren.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Wichtig ist, dass der Kunde die Status-LED vom Bett aus sehen kann.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich bohre einfach an einer passenden Stelle ein Loch.', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Man ben+�tigt keine Status-LED.', 'text', false, 40, 'vollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_1, 'single', 'Woher wei+� ich, welches Werkzeug ich f++r den Einbau ben+�tige?', 50, false, 'vollstaendig', 'doinstruct-allgemeinefragen', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Im Abschnitt ���Hilfsmittel/Werkzeuge" der jeweiligen Einbauanleitung.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das wei+� man, sobald man einmal ein THITRONIK Alarmsystem verbaut hat.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das kann man im Servicehandbuch des jeweiligen Fahrzeugs nachlesen.', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich probiere einfach aus, welche Werkzeuge passen.', 'text', false, 40, 'vollstaendig');
END $$;

-- ������ Module 2: CAN-Bus ������
DO $$ DECLARE kurs_2 UUID; lektion_2 UUID; quiz_2 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('canbus', 'CAN-Bus', 'Grundlagen zum CAN-Bus und dessen Bedeutung f++r die WiPro III.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-canbus', 5, false, false, 20)
  RETURNING id INTO kurs_2;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_2, 'canbus-quiz', 'CAN-Bus ��� Quiz', 'Wissenstest: CAN-Bus', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_2;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_2, 'CAN-Bus Quiz', 'sofort', 70)
  RETURNING id INTO quiz_2;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_2, 'single', 'Was ist der CAN-Bus?', 10, false, 'vollstaendig', 'doinstruct-canbus', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das zentrale Steuersystem des Fahrzeugs.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Zentralverriegelung des Fahrzeugs.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das Entertainmentsystem des Fahrzeugs.', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_2, 'single', 'Wozu ben+�tigt die WiPro III den CAN-Bus?', 20, false, 'vollstaendig', 'doinstruct-canbus', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Um auszuwerten, ob T++ren ge+�ffnet oder geschlossen sind.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Um die Innenbeleuchtung einzuschalten.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Zur Spannungsversorgung.', 'text', false, 30, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_2, 'single', 'Wo werden Dir CAN-Bus ++berwachte T++ren angezeigt?', 30, false, 'vollstaendig', 'doinstruct-canbus', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Im Kombiinstrument.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Im Display des Radios.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Im R++ckspiegel.', 'text', false, 30, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_2, 'single', 'Wie kannst Du pr++fen, welche T++r vom CAN-Bus ++berwacht wird?', 40, false, 'vollstaendig', 'doinstruct-canbus', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Indem ich die T++ren bei eingeschalteter Z++ndung +�ffne und im Kombiinstrument nachsehe.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich muss das nicht pr++fen, denn wenn eine Zentralverriegelung vorhanden ist, werden alle T++ren vom CAN-Bus ++berwacht.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Indem ich im Fahrzeugschein nachlese.', 'text', false, 30, 'vollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_2, 'single', 'Wie kann ich eine T++r absichern, die nicht vom CAN-Bus ++berwacht wird?', 50, false, 'vollstaendig', 'doinstruct-canbus', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Mit einem Funk-Magnetkontakt.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ausschlie+�lich mit einem mechanischen T++rkontakt.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Gar nicht.', 'text', false, 30, 'vollstaendig');
END $$;

-- ������ Module 3: Fahrzeug++bergabe ������
DO $$ DECLARE kurs_3 UUID; lektion_3 UUID; quiz_3 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('fahrzeugubergabe', 'Fahrzeug++bergabe', 'Doinstruct Manager ��� Ablauf und Hilfsmittel f++r die Fahrzeug++bergabe nach dem Einbau.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-fahrzeugubergabe', 5, true, false, 30)
  RETURNING id INTO kurs_3;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_3, 'fahrzeugubergabe-quiz', 'Fahrzeug++bergabe ��� Quiz', 'Wissenstest: Fahrzeug++bergabe', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_3;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_3, 'Fahrzeug++bergabe Quiz', 'sofort', 70)
  RETURNING id INTO quiz_3;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_3, 'single', 'Was sollte nach jeder erfolgreichen Montage eines THITRONIK Systems als erstes erfolgen?', 10, false, 'vollstaendig', 'doinstruct-fahrzeugubergabe', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ein Rundgang mit dem Kunden, um das Fahrzeug, um alle verbauten Komponenten vorzustellen.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Eine ausgiebige Kaffeepause mit dem Kunden.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die +�bergabe der Rechnung an den Kunden.', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_3, 'single', 'Welche Hilfsmittel kann ich nutzen, beispielsweise um f++r eine m+�glichst pr+�zise +�bergabe zu sorgen?', 20, false, 'vollstaendig', 'doinstruct-fahrzeugubergabe', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die THITRONIK Kurzanleitungen', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Bordmappe des Fahrzeugs', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Den Kaufvertrag des Fahrzeugs', 'text', false, 30, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_3, 'single', 'Welche zus+�tzlichen Informationen solltest Du immer auf den THITRONIK Kurzanleitungen vermerken?', 30, false, 'vollstaendig', 'doinstruct-fahrzeugubergabe', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Seriennummer des Produkts sowie Angaben, wie und wo das Produkt abgesichert ist.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Artikelnummer des Produkts sowie Angaben, wie und wo das Produkt abgesichert ist.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Seriennummer des Produkts und den Namen des Monteurs.', 'text', false, 30, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_3, 'single', 'Wie k+�nnen sich Kunden ++ber weitere Funktionen und Nutzungsm+�glichkeiten von THITRONIK Produkten informieren?', 40, false, 'vollstaendig', 'doinstruct-fahrzeugubergabe', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '+�ber den THITRONIK Youtube-Kanal mit hilfreichen Anwender-Videos sowie Tipps und Tricks zur Pflege und Wartung.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'In den Katalogen der Gro+�h+�ndler.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'In den Gelben Seiten.', 'text', false, 30, 'vollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_3, 'single', 'Welches Ziel musst Du unbedingt erreicht haben, wenn Du das Fahrzeug nach dem Einbau an Deinen Kunden ++bergeben hast?', 50, false, 'vollstaendig', 'doinstruct-fahrzeugubergabe', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der Kunde muss die Bedienung des Alarmsystems komplett verstanden haben.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der Kunde muss wissen, dass die Produkte Made in Schleswig-Holstein sind.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der Kunde muss wissen, dass alle Bedienungsanleitungen auch von der THITRONIK Website heruntergeladen werden k+�nnen.', 'text', false, 30, 'vollstaendig');
END $$;

-- ������ Module 4: Fehlersuche Quiz ������
DO $$ DECLARE kurs_4 UUID; lektion_4 UUID; quiz_4 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('fehlersuche', 'Fehlersuche Quiz', 'Bildbasierte Fragen zur korrekten Installation und Fehlersuche bei THITRONIK Komponenten.', 'veroeffentlicht', 'medien_fehlen', 'doinstruct-fehlersuche', 6, false, true, 40)
  RETURNING id INTO kurs_4;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_4, 'fehlersuche-quiz', 'Fehlersuche Quiz ��� Quiz', 'Wissenstest: Fehlersuche Quiz', 'veroeffentlicht', 'medien_fehlen', 10)
  RETURNING id INTO lektion_4;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_4, 'Fehlersuche Quiz Quiz', 'sofort', 70)
  RETURNING id INTO quiz_4;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_4, 'bild', 'Bei welchen UB2A-Gelverbindern liegt keine einwandfreie Installation vor?', 10, true, 'medien_fehlen', 'doinstruct-fehlersuche', 'Bildoptionen: 4 korrekt, 1 falsch. Bilder im Quell-Export als Referenzen vorhanden.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Gelverbinder-Option 1', 'bild', true, 10, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Gelverbinder-Option 2', 'bild', true, 20, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Gelverbinder-Option 3', 'bild', true, 30, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Gelverbinder-Option 4', 'bild', true, 40, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Gelverbinder-Option 5 (korrekte Installation)', 'bild', false, 50, 'medien_fehlen');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_4, 'bild', 'Welche Funk-Magnetkontakte wurden korrekt installiert?', 20, true, 'medien_fehlen', 'doinstruct-fehlersuche', 'Bildoptionen: 2 korrekt, 5 falsch.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Magnetkontakt 1 (korrekt)', 'bild', true, 10, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Magnetkontakt 2 (korrekt)', 'bild', true, 20, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Magnetkontakt 3', 'bild', false, 30, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Magnetkontakt 4', 'bild', false, 40, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Magnetkontakt 5', 'bild', false, 50, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Magnetkontakt 6', 'bild', false, 60, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Magnetkontakt 7', 'bild', false, 70, 'medien_fehlen');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_4, 'bild', 'Wie sollte die Verkabelung nach dem Einbau der Thitronik-Komponenten idealerweise nicht aussehen?', 30, true, 'medien_fehlen', 'doinstruct-fehlersuche', 'Bildoptionen: 5 korrekt (schlecht), 1 falsch (gut).')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verkabelung 1 (schlecht)', 'bild', true, 10, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verkabelung 2 (schlecht)', 'bild', true, 20, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verkabelung 3 (schlecht)', 'bild', true, 30, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verkabelung 4 (schlecht)', 'bild', true, 40, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verkabelung 5 (schlecht)', 'bild', true, 50, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verkabelung 6 (korrekt)', 'bild', false, 60, 'medien_fehlen');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_4, 'bild', 'Wie darf die Verklebung der Funk-Magnetkontakte nicht erfolgen, damit Halt und Funktion dauerhaft sichergestellt sind?', 40, true, 'medien_fehlen', 'doinstruct-fehlersuche', 'Bildoptionen: 3 korrekt (falsche Verklebung), 1 falsch (korrekte Verklebung).')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verklebung 1 (falsch)', 'bild', true, 10, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verklebung 2 (falsch)', 'bild', true, 20, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verklebung 3 (falsch)', 'bild', true, 30, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Verklebung 4 (korrekt)', 'bild', false, 40, 'medien_fehlen');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_4, 'single', 'Was gibt es bei der Funktion der beiden Tasten auf dem Funk-Handsender zu beachten?', 50, false, 'vollstaendig', 'doinstruct-fehlersuche', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Jeder Tastendruck f++hrt den n+�chstlogischen Schritt aus ��� wahlweise mit oder ohne Ton.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die obere Taste dient ausschlie+�lich zum Entsch+�rfen...', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die obere Taste entriegelt, die untere verriegelt...', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die obere Taste sorgt f++r stillen Alarm...', 'text', false, 40, 'vollstaendig');
  -- Frage 6
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_4, 'bild', 'Wo sollte das G.A.S. verbaut sein, damit es optimal funktioniert?', 60, false, 'medien_fehlen', 'doinstruct-fehlersuche', 'Bildoption 1 korrekt, Bildoption 2 falsch.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'G.A.S. Position 1 (korrekt)', 'bild', true, 10, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'G.A.S. Position 2 (falsch)', 'bild', false, 20, 'medien_fehlen');
END $$;

-- ������ Module 5: Funkzubeh+�r ������
DO $$ DECLARE kurs_5 UUID; lektion_5 UUID; quiz_5 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('funkzubehoer', 'Funkzubeh+�r', 'Anlernen und Konfigurieren des THITRONIK Funkzubeh+�rs an die WiPro III.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-funkzubehoer', 5, false, false, 50)
  RETURNING id INTO kurs_5;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_5, 'funkzubehoer-quiz', 'Funkzubeh+�r ��� Quiz', 'Wissenstest: Funkzubeh+�r', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_5;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_5, 'Funkzubeh+�r Quiz', 'sofort', 70)
  RETURNING id INTO quiz_5;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_5, 'single', 'Was musst Du machen, nachdem Du alle Komponenten montiert hast?', 10, false, 'vollstaendig', 'doinstruct-funkzubehoer', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das gesamte Funk-Zubeh+�r an die WiPro III anlernen.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Mittagspause.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Den Luftdruck kontrollieren.', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_5, 'single', 'Wie lernst Du das Funkzubeh+�r idealerweise an?', 20, false, 'vollstaendig', 'doinstruct-funkzubehoer', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Zusammen mit einer zweiten Person.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Im Dunkeln.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Allein nach Feierabend.', 'text', false, 30, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_5, 'single', 'Was ist der erste Schritt zum Anlernen des Funkzubeh+�rs?', 30, false, 'vollstaendig', 'doinstruct-funkzubehoer', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das Starten des Anlernmodus', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das Abklemmen der Fahrzeugbatterie', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das Einschalten der Z++ndung', 'text', false, 30, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_5, 'single', 'Woran erkennst Du, dass der Anlernvorgang erfolgreich war?', 40, false, 'vollstaendig', 'doinstruct-funkzubehoer', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Beispielsweise am Quittungston der WiPro III.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'An der gr++n leuchtenden LED.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'An der Meldung im Kombiinstrument.', 'text', false, 30, 'vollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_5, 'single', 'Woran muss Du nach dem Anlernen des Funk-Zubeh+�rs unbedingt denken?', 50, false, 'vollstaendig', 'doinstruct-funkzubehoer', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Den Anlernmodus zu beenden.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Z++ndung auszuschalten.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das Fahrzeug abzuschlie+�en.', 'text', false, 30, 'vollstaendig');
END $$;

-- ������ Module 6: Gelverbinder ������
DO $$ DECLARE kurs_6 UUID; lektion_6 UUID; quiz_6 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('gelverbinder', 'Gelverbinder', 'Korrekte Verarbeitung und Handhabung von Gelverbindern f++r sichere Kabelverbindungen.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-gelverbinder', 5, true, false, 60)
  RETURNING id INTO kurs_6;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_6, 'gelverbinder-quiz', 'Gelverbinder ��� Quiz', 'Wissenstest: Gelverbinder', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_6;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_6, 'Gelverbinder Quiz', 'sofort', 70)
  RETURNING id INTO quiz_6;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_6, 'single', 'Wozu dienen Gelverbinder?', 10, false, 'vollstaendig', 'doinstruct-gelverbinder', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Gelverbinder sorgen f++r eine sichere und dauerhafte Kabelverbindung.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Mit Gelverbindern stellst Du eine Steckverbindung her.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Mit Gelverbindern stellst Du eine gel+�tete Kabelverbindung her.', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_6, 'single', 'Welcher Bestandteil des Gelverbinders sorgt f++r einen besonders guten Schutz vor Korrosion?', 20, false, 'vollstaendig', 'doinstruct-gelverbinder', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das im Gelverbinder enthaltene Silikongel.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der transparente Teil des Geh+�uses.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die rostfreien Klingen.', 'text', false, 30, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_6, 'single', 'Worauf solltest Du bei der Verarbeitung der Gelverbinder besonders achten?', 30, false, 'vollstaendig', 'doinstruct-gelverbinder', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Auf den korrekten, spannungsfreien Sitz der Kabel.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Darauf, den Gelverbinder m+�glichst nah an vorhandenen Steckergeh+�usen platzieren.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Darauf, den Gelverbinder horizontal auszurichten.', 'text', false, 30, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_6, 'single', 'Worauf musst Du beim Crimpen von Gelverbindern stets achten?', 40, false, 'vollstaendig', 'doinstruct-gelverbinder', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Auf das einwandfreie Verriegeln des Gelverbinders, das durch ein Klicken h+�rbar ist.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Darauf, den Gelverbinder so fest wie m+�glich zusammenzupressen.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Du musst sicherstellen, dass m+�glichst viel Silikongel austritt.', 'text', false, 30, 'vollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_6, 'single', 'Welches Werkzeug empfehlen wir f++r eine pr+�zise und einfache Verarbeitung von Gelverbindern?', 50, false, 'vollstaendig', 'doinstruct-gelverbinder', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Eine Scotchlock-Zange.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Einen Schraubstock.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Einen Hammer.', 'text', false, 30, 'vollstaendig');
END $$;

-- ������ Module 7: Grundlagen ������
DO $$ DECLARE kurs_7 UUID; lektion_7 UUID; quiz_7 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('grundlagen', 'Grundlagen', 'Grundwissen zum Umgang mit Einbauanleitungen und Vorbereitung auf den Einbau.', 'veroeffentlicht', 'unvollstaendig', 'doinstruct-grundlagen', 5, false, false, 70)
  RETURNING id INTO kurs_7;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_7, 'grundlagen-quiz', 'Grundlagen ��� Quiz', 'Wissenstest: Grundlagen', 'veroeffentlicht', 'unvollstaendig', 10)
  RETURNING id INTO lektion_7;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_7, 'Grundlagen Quiz', 'sofort', 70)
  RETURNING id INTO quiz_7;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_7, 'single', 'Welche Informationen brauchst Du, um die richtige Einbauanleitung auszuw+�hlen?', 10, false, 'vollstaendig', 'doinstruct-grundlagen', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Basisfahrzeugtyp, Baujahr', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Fahrgestellnummer', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Aufbauhersteller', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_7, 'single', 'Wo findest Du die richtige Einbauanleitung?', 20, false, 'vollstaendig', 'doinstruct-grundlagen', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Im H+�ndler-Bereich', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Im Werkstattordner', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'In der Produktverpackung', 'text', false, 30, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_7, 'single', 'Welchen Abschnitt der Einbauanleitung solltest Du Dir vor jeder Installation einer WiPro III aufmerksam durchlesen?', 30, false, 'unvollstaendig', 'doinstruct-grundlagen', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_7, 'single', 'Wie ermittelst Du das Baujahr des Basisfahrzeugs (in Bezug auf die Einbauunterlagen), wenn Du Dir nicht sicher bist?', 40, false, 'unvollstaendig', 'doinstruct-grundlagen', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_7, 'single', 'Was solltest Du immer vor Arbeiten an einem Kundenfahrzeug durchf++hren?', 50, false, 'unvollstaendig', 'doinstruct-grundlagen', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
END $$;

-- ������ Module 8: Konfigurator ������
DO $$ DECLARE kurs_8 UUID; lektion_8 UUID; quiz_8 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('konfigurator', 'Konfigurator', 'Der THITRONIK Konfigurator: Kostenvoranschl+�ge f++r Alarmsystem-Einbauten erstellen.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-konfigurator', 5, true, false, 80)
  RETURNING id INTO kurs_8;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_8, 'konfigurator-quiz', 'Konfigurator ��� Quiz', 'Wissenstest: Konfigurator', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_8;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_8, 'Konfigurator Quiz', 'sofort', 70)
  RETURNING id INTO quiz_8;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_8, 'single', 'Was ist der THITRONIK Konfigurator?', 10, false, 'vollstaendig', 'doinstruct-konfigurator', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Werkzeug, um f++r einen Kunden einen pr+�zisen, ++bersichtlichen und leicht verst+�ndlichen Kostenvoranschlag f++r den Einbau eines THITRONIK Alarmsystems zu erstellen.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nachr++stung von Fahrzeug-Elektronik', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nachr++stung von Fahrzeugzubeh+�r', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_8, 'single', 'Wo findest Du den THITRONIK Konfigurator?', 20, false, 'vollstaendig', 'doinstruct-konfigurator', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Von jeder beliebigen Seite der THITRONIK Website ++ber eine Schaltfl+�che oben links erreichbar.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '+�ber einen Link im Impressum.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '+�ber eine Schaltfl+�che oben rechts.', 'text', false, 30, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_8, 'single', 'Werden im THITRONIK Konfigurator auch eventuell n+�tige Zubeh+�rteile ber++cksichtigt?', 30, false, 'vollstaendig', 'doinstruct-konfigurator', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ja. Zubeh+�rteile wie Umr++stplatinen werden ber++cksichtigt und mit ausgew+�hlt oder zur Auswahl angeboten.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nein, Zubeh+�r wird nicht ber++cksichtigt.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nein, Zubeh+�r muss immer nachtr+�glich manuell gew+�hlt werden.', 'text', false, 30, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_8, 'single', 'Kann der THITRONIK Konfigurator auch Preise f++r andere L+�nder, z. B. die Schweiz, anzeigen?', 40, false, 'vollstaendig', 'doinstruct-konfigurator', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ja. Du kannst den Endpreis ++ber die L+�nderauswahl anzeigen.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nein, nur deutsche Netto-Preise.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nein, nur UVP Deutschland inkl. MwSt.', 'text', false, 30, 'vollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_8, 'single', 'Kann ich meinem Kunden die Konfiguration nach der Beratung zukommen lassen?', 50, false, 'vollstaendig', 'doinstruct-konfigurator', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ja, z. B. ++ber einen QR-Code am Ende der Konfiguration.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ergebnis ist nur am Bildschirm ablesbar.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ergebnis kann nicht gespeichert werden.', 'text', false, 30, 'vollstaendig');
END $$;

-- ������ Module 9: Magnet und Montageadapter ������
DO $$ DECLARE kurs_9 UUID; lektion_9 UUID; quiz_9 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('montageadapter', 'Magnet und Montageadapter', 'Korrekte Montage von Funk-Magnetkontakten mit Montageadaptern.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-montageadapter', 5, false, false, 90)
  RETURNING id INTO kurs_9;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_9, 'montageadapter-quiz', 'Magnet und Montageadapter ��� Quiz', 'Wissenstest: Magnet und Montageadapter', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_9;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_9, 'Magnet und Montageadapter Quiz', 'sofort', 70)
  RETURNING id INTO quiz_9;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_9, 'single', 'Wozu ben+�tigt man Montageadapter?', 10, false, 'vollstaendig', 'doinstruct-montageadapter', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Zur korrekten Ausrichtung der Funk-Magnetkontakte und zur Schaffung einer geeigneten Klebefl+�che.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Zum Ausgleich von Farbunterschieden', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Zur versteckten Montage', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_9, 'single', 'Wie befestigt man einen Montageadapter?', 20, false, 'vollstaendig', 'doinstruct-montageadapter', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Mit Schrauben.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Wird geklebt.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ist magnetisch.', 'text', false, 30, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_9, 'single', 'Kannst Du den Montageadapter auch nutzen, um Abst+�nde zu ++berbr++cken?', 30, false, 'vollstaendig', 'doinstruct-montageadapter', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ja. Der Montageadapter kann f++r jede Art der Ausrichtung verwendet werden.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nein, nur f++r vertikale Ausrichtung.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nein, Abstand l+�sst sich nicht korrigieren.', 'text', false, 30, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_9, 'single', 'Kann der Montageadapter zur Montage auf Dichtungen verwendet werden?', 40, false, 'vollstaendig', 'doinstruct-montageadapter', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ja. Der Montageadapter schafft daf++r die ben+�tigte Klebefl+�che.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nein, dadurch wird der Empfang eingeschr+�nkt.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nein, der H+�henunterschied w++rde zu gro+� werden.', 'text', false, 30, 'vollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_9, 'single', 'Sind die Montageadapter f++r die Montage der Funk-Magnetkontakte im Au+�enbereich geeignet?', 50, false, 'vollstaendig', 'doinstruct-montageadapter', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nein, da die Funk-Magnetkontakte nicht f++r den Au+�enbereich vorgesehen sind.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ja, da sie geschraubt werden.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ja, wenn spritzwassergesch++tzt montiert.', 'text', false, 30, 'vollstaendig');
END $$;

-- ������ Module 10: Mercedes-Benz Sprinter VS30 ������
DO $$ DECLARE kurs_10 UUID; lektion_10 UUID; quiz_10 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('mb-sprinter-vs30', 'Mercedes-Benz Sprinter VS30', 'Einbau der WiPro III safe.lock im Mercedes-Benz Sprinter VS30.', 'veroeffentlicht', 'unvollstaendig', 'doinstruct-mb-sprinter-vs30', 12, false, false, 100)
  RETURNING id INTO kurs_10;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_10, 'mb-sprinter-vs30-quiz', 'Mercedes-Benz Sprinter VS30 ��� Quiz', 'Wissenstest: Mercedes-Benz Sprinter VS30', 'veroeffentlicht', 'unvollstaendig', 10)
  RETURNING id INTO lektion_10;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_10, 'Mercedes-Benz Sprinter VS30 Quiz', 'sofort', 70)
  RETURNING id INTO quiz_10;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Welche Zahlen auf der +�bersichtsseite ���Werkstattunterlagen" geben an, wann eine Anleitung zuletzt ge+�ndert wurde?', 10, false, 'vollstaendig', 'doinstruct-mb-sprinter-vs30', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '10/2025', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '2018+', 'text', false, 20, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Welche DIP-Schalterstellung muss ich w+�hlen, wenn ich eine WiPro III safe.lock in einen Mercedes Sprinter VS30 einbaue?', 20, false, 'vollstaendig', 'doinstruct-mb-sprinter-vs30', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Alle Schalter auf OFF', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nur Schalter 3 auf ON', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nur Schalter 6 auf ON', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Schalter 6 und 3 auf ON', 'text', false, 40, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Welche Seriennummer muss die Zentrale haben, damit sie verwendet werden kann?', 30, false, 'vollstaendig', 'doinstruct-mb-sprinter-vs30', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Seriennr. 1050-048', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Seriennr. 1050-999', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Seriennr. 1050-123', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Seriennr. 1050-007', 'text', false, 40, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Woran erkenne ich, dass ein Fahrzeug Originalt++ren hat und wo kann ich das nachlesen?', 40, false, 'vollstaendig', 'doinstruct-mb-sprinter-vs30', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Wenn ein Fahrzeug Originalt++ren hat, wird im Tacho angezeigt, wenn diese ge+�ffnet sind.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich kann mit dem Originalschl++ssel ver- und entriegeln...', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ich kann mit dem Fahrzeugschl++ssel abschlie+�en...', 'text', false, 30, 'vollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Warum sollten Sie zus+�tzlich zum WiPro III safe.lock Alarmsystem eine Zusatzhupe einbauen?', 50, false, 'unvollstaendig', 'doinstruct-mb-sprinter-vs30', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
  -- Frage 6
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'An welchen Pin musst du das rot-rosafarbene Kabel der WiPro III safe.lock f++r den Warnblinkeranschluss anschlie+�en?', 60, false, 'unvollstaendig', 'doinstruct-mb-sprinter-vs30', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
  -- Frage 7
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'An welcher Sicherung kann die Z++ndung f++r den Anschluss der WiPro III safe.lock abgegriffen werden?', 70, false, 'unvollstaendig', 'doinstruct-mb-sprinter-vs30', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
  -- Frage 8
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Was zeigt dieses Bild?', 80, false, 'unvollstaendig', 'doinstruct-mb-sprinter-vs30', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
  -- Frage 9
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Wir empfehlen in unseren Einbauanleitungen immer, vorab die Fahrzeuggegebenheiten zu kontrollieren. Warum ist das wichtig? (Zwei Antworten sind richtig.)', 90, false, 'unvollstaendig', 'doinstruct-mb-sprinter-vs30', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
  -- Frage 10
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Welche Farbe hat das Warnblinker-Kabel des Mercedes Sprinter VS30?', 100, false, 'unvollstaendig', 'doinstruct-mb-sprinter-vs30', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
  -- Frage 11
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Mein Kunde m+�chte eine Alarmanlage f++r seinen teilintegrierten Mercedes VS30 mit Eura-Mobil-Aufbau. Was muss ich als Monteur beachten?', 110, false, 'unvollstaendig', 'doinstruct-mb-sprinter-vs30', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
  -- Frage 12
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_10, 'single', 'Was ist der THITRONIK Campingmodus?', 120, false, 'unvollstaendig', 'doinstruct-mb-sprinter-vs30', 'Antworten im Quell-Export nicht enthalten. Redaktionelle Erg+�nzung erforderlich.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, '[Antwort im Quell-Export nicht enthalten]', 'text', false, 10, 'unvollstaendig');
END $$;

-- ������ Module 11: Pro-finder ������
DO $$ DECLARE kurs_11 UUID; lektion_11 UUID; quiz_11 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('pro-finder', 'Pro-finder', 'GPS-Ortung mit dem THITRONIK Pro-finder: Einbau, Ausrichtung und Konfiguration.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-pro-finder', 4, true, false, 110)
  RETURNING id INTO kurs_11;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_11, 'pro-finder-quiz', 'Pro-finder ��� Quiz', 'Wissenstest: Pro-finder', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_11;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_11, 'Pro-finder Quiz', 'sofort', 70)
  RETURNING id INTO quiz_11;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_11, 'single', 'Welche Hauptfunktion hat der Pro-finder?', 10, false, 'vollstaendig', 'doinstruct-pro-finder', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die GPS-Ortung', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Fernsteuerung der Bewegungssensoren.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das Fernstarten des Motors.', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_11, 'single', 'Welche Materialien d++rfen den Pro-finder nicht abdecken, sofern keine externe GPS-Antenne angeschlossen ist?', 20, false, 'vollstaendig', 'doinstruct-pro-finder', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Stahl und Aluminium', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'GFK und Kunststoff', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Holz und Glas', 'text', false, 30, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_11, 'single', 'Wie muss der Pro-finder ausgerichtet werden, wenn keine externe GPS-Antenne angeschlossen ist?', 30, false, 'vollstaendig', 'doinstruct-pro-finder', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Waagerecht mit blauem Aufkleber nach oben.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Es spielt keine Rolle.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Immer hochkant, GSM-Antenne nach oben.', 'text', false, 30, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_11, 'single', 'Was musst Du bedenken, um den besten Einbauort f++r den Pro-finder zu finden?', 40, false, 'vollstaendig', 'doinstruct-pro-finder', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Versteckter Einbauort, korrekte Ausrichtung, zugleich erreichbar z. B. f++r SIM-Kartentausch.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'So unzug+�nglich und weit unten wie m+�glich.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'M+�glichst auf dem Armaturenbrett.', 'text', false, 30, 'vollstaendig');
END $$;

-- ������ Module 12: Thitronik Test 1 ������
DO $$ DECLARE kurs_12 UUID; lektion_12 UUID; quiz_12 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('thitronik-test1', 'Thitronik Test 1', 'Praxistest mit Bild- und Textfragen zu h+�ufigen Einbausituationen.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-test1', 6, false, true, 120)
  RETURNING id INTO kurs_12;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_12, 'thitronik-test1-quiz', 'Thitronik Test 1 ��� Quiz', 'Wissenstest: Thitronik Test 1', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_12;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_12, 'Thitronik Test 1 Quiz', 'sofort', 70)
  RETURNING id INTO quiz_12;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_12, 'single', 'Warum l+�sst sich der Pro-finder nicht programmieren?', 10, false, 'vollstaendig', 'doinstruct-test1', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der Pro-finder ist bereits programmiert und die SMS wurde nicht vom Hauptnutzer verschickt.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Sim-Karte unterst++tzt keine SMS.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Die Seriennummern wurden nicht eingetragen.', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der Pro-finder unterst++tzt die Sim-Karte nicht.', 'text', false, 40, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_12, 'single', 'Es wurde eine Zusatzsirene verbaut. Diese funktioniert nun, jedoch reagiert die Zentralverriegelung ++ber den Handsender pl+�tzlich nicht mehr. Woran kann das liegen?', 20, false, 'vollstaendig', 'doinstruct-test1', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das vorgepinnte wei+�/schwarze Kabel im WiPro-Stecker wurde ausgepinnt.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Man kann keine Zusatzsirene nutzen.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Nach Installation sind die ZV-Kabel erneut zu verbinden.', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Eine +�berspannung ist entstanden.', 'text', false, 40, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_12, 'single', 'Was gilt es beim Verbau des Funk-Magnetkontaktes auf diesem Foto als Beispiel zu beachten?', 30, false, 'medien_fehlen', 'doinstruct-test1', 'Frage enth+�lt Foto-Referenz ��� Bild im Quell-Export nicht mitgeliefert.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das Fenster muss fast komplett ge+�ffnet werden, damit der Kontakt ++berhaupt reagieren kann.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Kontakt muss an nicht beweglicher Seite montiert sein.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Es sollten Montageadapter verwendet werden.', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'An diesem Fenster sollte generell kein Kontakt verbaut werden.', 'text', false, 40, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_12, 'single', 'Welche Antwort ist hier bei dem verbautem CO-Sensor korrekt?', 40, false, 'medien_fehlen', 'doinstruct-test1', 'Frage enth+�lt Foto-Referenz ��� Bild im Quell-Export nicht mitgeliefert.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der Sensor wurde falschherum montiert.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Sensor h+�tte weiter oben montiert werden m++ssen.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der verbaute Sensor kann dort die Elektronik st+�ren.', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Sensor muss am Boden montiert werden.', 'text', false, 40, 'vollstaendig');
  -- Frage 5
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_12, 'single', 'Welches Problem kann hier entstehen?', 50, false, 'medien_fehlen', 'doinstruct-test1', 'Frage enth+�lt Foto-Referenz ��� Bild im Quell-Export nicht mitgeliefert.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Das Fahrzeug l+�sst sich nicht starten, da der Transponder nicht erkannt wird ��� Abstand zu gro+�.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der Transponder verhindert, dass die Umr++stplatine eingesetzt werden kann.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Der Transponder befindet sich auf der Umr++stplatine von Thitronik.', 'text', false, 30, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Ausschlie+�lich der originale Transponder von der Fiat-Platine hat Funktion.', 'text', false, 40, 'vollstaendig');
  -- Frage 6
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_12, 'bild', 'Welcher Gelverbinder wurde korrekt geschlossen?', 60, false, 'medien_fehlen', 'doinstruct-test1', 'Bild-Antwortoptionen im Quell-Export.')
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Dieser ist korrekt verschlossen und auch die Kabelf++hrung ist korrekt im Verbinder.', 'bild', true, 10, 'medien_fehlen');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Diese sind korrekt verschlossen, er darf nicht ganz geschlossen sein.', 'bild', false, 20, 'medien_fehlen');
END $$;

-- ������ Module 13: WiPro ������
DO $$ DECLARE kurs_13 UUID; lektion_13 UUID; quiz_13 UUID; frage_id UUID; BEGIN
  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)
  VALUES ('wipro', 'WiPro', 'Montage und Inbetriebnahme der WiPro III Alarmzentrale.', 'veroeffentlicht', 'vollstaendig', 'doinstruct-wipro', 4, false, false, 130)
  RETURNING id INTO kurs_13;
  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)
  VALUES (kurs_13, 'wipro-quiz', 'WiPro ��� Quiz', 'Wissenstest: WiPro', 'veroeffentlicht', 'vollstaendig', 10)
  RETURNING id INTO lektion_13;
  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)
  VALUES (lektion_13, 'WiPro Quiz', 'sofort', 70)
  RETURNING id INTO quiz_13;
  -- Frage 1
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_13, 'single', 'Womit sollte die WiPro III befestigt werden?', 10, false, 'vollstaendig', 'doinstruct-wipro', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Mit dem an der WiPro III vorhandenen Klebepad.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Mit Schrauben.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Mit Gaffatape ++ber das komplette Geh+�use/den Lautsprecher.', 'text', false, 30, 'vollstaendig');
  -- Frage 2
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_13, 'single', 'Worauf solltest Du vor dem Aufkleben der WiPro III achten?', 20, false, 'vollstaendig', 'doinstruct-wipro', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'gereinigter / entfetteter Untergrund', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'staubiger Untergrund', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'schmieriger Untergrund', 'text', false, 30, 'vollstaendig');
  -- Frage 3
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_13, 'single', 'Worauf musst Du beim Ausrichten der WiPro achten?', 30, false, 'vollstaendig', 'doinstruct-wipro', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'nicht den Taster bet+�tigen', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Kabelbinder um das Geh+�use', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Lautsprecher verdeckt', 'text', false, 30, 'vollstaendig');
  -- Frage 4
  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)
  VALUES (quiz_13, 'single', 'Was ist generell beim Abschluss der Montage der WiPro III zu beachten?', 40, false, 'vollstaendig', 'doinstruct-wipro', NULL)
  RETURNING id INTO frage_id;
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Alle Stecker des Basisfahrzeugs m++ssen wieder fest eingesteckt und verriegelt sein.', 'text', true, 10, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Einige Stecker bleiben lose.', 'text', false, 20, 'vollstaendig');
  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)
  VALUES (frage_id, 'Es spielt keine Rolle, wie Kabel und Stecker angeordnet sind, da der Kunde das sp+�ter nicht sieht.', 'text', false, 30, 'vollstaendig');
END $$;

COMMIT;

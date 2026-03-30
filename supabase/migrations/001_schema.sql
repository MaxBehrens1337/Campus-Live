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

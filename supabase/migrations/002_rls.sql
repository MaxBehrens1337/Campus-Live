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

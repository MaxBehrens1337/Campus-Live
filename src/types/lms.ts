// ═══════════════════════════════════════════════════════════════════════════
// THITRONIK Campus Academy – LMS Types
// ═══════════════════════════════════════════════════════════════════════════

// ── Enums ────────────────────────────────────────────────────────────────

export type Rolle = "admin" | "editor" | "trainer" | "lernender";
export type KursStatus = "entwurf" | "veroeffentlicht" | "archiviert";
export type LektionStatus = "entwurf" | "veroeffentlicht" | "archiviert";
export type QuellStatus = "vollstaendig" | "unvollstaendig" | "medien_fehlen" | "redaktion_pruefen";
export type BlockTyp = "text" | "bild" | "video" | "pdf" | "hinweis" | "schritte" | "quiz_verweis";
export type FrageTyp = "single" | "multiple" | "bild";
export type OptionTyp = "text" | "bild" | "bild_mit_text" | "platzhalter";
export type MedienTyp = "bild" | "video" | "pdf" | "dokument" | "poster";
export type FortschrittStatus = "nicht_gestartet" | "in_bearbeitung" | "abgeschlossen";

// ── Profile (replaces former Haendler) ──────────────────────────────────

export interface Profil {
  id: string;
  rolle: Rolle;
  anzeigename: string | null;
  firma: string | null;
  kundennummer: string | null;
  locale: string;
  aktiv: boolean;
  erstellt_am: string;
  geaendert_am: string;
}

/** @deprecated Use Profil instead. Kept for legacy compatibility. */
export interface Haendler {
  id: string;
  kundennummer: string;
  firmenname: string | null;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  rolle: string;
  aktiv: boolean;
  erstellt_am: string;
}

// ── Kurs (Module) ───────────────────────────────────────────────────────

export interface Kurs {
  id: string;
  slug: string;
  titel: string;
  untertitel: string | null;
  beschreibung: string | null;
  bild_url: string | null;
  status: KursStatus;
  quell_status: QuellStatus;
  quell_datei: string | null;
  fragen_anzahl: number;
  hat_video: boolean;
  hat_bilder: boolean;
  reihenfolge: number;
  erstellt_am: string;
  geaendert_am: string;
  // computed
  lektionen_anzahl?: number;
}

// ── Lektion ─────────────────────────────────────────────────────────────

export interface Lektion {
  id: string;
  kurs_id: string;
  slug: string | null;
  titel: string;
  beschreibung: string | null;
  lektion_typ: string;
  status: LektionStatus;
  quell_status: QuellStatus;
  reihenfolge: number;
  dauer_min: number | null;
  version: string;
  zielgruppe: string | null;
  erstellt_am: string;
  geaendert_am: string;
}

// ── Inhaltsblock ────────────────────────────────────────────────────────

export interface Inhaltsblock {
  id: string;
  lektion_id: string;
  typ: BlockTyp;
  ueberschrift: string | null;
  inhalt: string | null;
  media_asset_id: string | null;
  metadaten: Record<string, unknown>;
  reihenfolge: number;
  erstellt_am: string;
}

// ── Medien Asset ────────────────────────────────────────────────────────

export interface MedienAsset {
  id: string;
  storage_pfad: string | null;
  medien_typ: MedienTyp;
  titel: string | null;
  alt_text: string | null;
  poster_pfad: string | null;
  platzhalter: boolean;
  quell_datei: string | null;
  quell_status: QuellStatus;
  metadaten: Record<string, unknown>;
  erstellt_am: string;
}

// ── Quiz ────────────────────────────────────────────────────────────────

export interface Quiz {
  id: string;
  lektion_id: string;
  titel: string;
  modus: "sofort" | "am_ende";
  mindestquote: number;
  zufallsreihenfolge: boolean;
  erstellt_am: string;
  // computed
  fragen_anzahl?: number;
}

// ── Frage ───────────────────────────────────────────────────────────────

export interface Frage {
  id: string;
  quiz_id: string;
  typ: FrageTyp;
  fragetext: string;
  erklaerung: string | null;
  media_id: string | null;
  reihenfolge: number;
  mehrere_korrekt: boolean;
  inhalt_status: QuellStatus;
  quell_datei: string | null;
  notizen_redaktion: string | null;
  erstellt_am: string;
  // joined
  antwortoptionen?: Antwortoption[];
}

// ── Antwortoption ───────────────────────────────────────────────────────

export interface Antwortoption {
  id: string;
  frage_id: string;
  text: string | null;
  option_typ: OptionTyp;
  media_asset_id: string | null;
  ist_korrekt: boolean;
  reihenfolge: number;
  quell_status: QuellStatus;
  erstellt_am: string;
}

// ── Lernfortschritt ─────────────────────────────────────────────────────

export interface Lernfortschritt {
  id: string;
  user_id: string;
  lektion_id: string;
  status: FortschrittStatus;
  prozent: number;
  abgeschlossen_am: string | null;
}

// ── Quiz-Versuch ────────────────────────────────────────────────────────

export interface QuizVersuch {
  id: string;
  user_id: string;
  quiz_id: string;
  gestartet_am: string;
  abgeschlossen_am: string | null;
  punkte: number | null;
  max_punkte: number | null;
  bestanden: boolean | null;
}

// ── Redaktionelle Notiz ─────────────────────────────────────────────────

export interface RedaktionelleNotiz {
  id: string;
  entitaet_typ: string;
  entitaet_id: string;
  typ: string;
  schwere: "info" | "warnung" | "kritisch";
  status: "offen" | "in_bearbeitung" | "erledigt";
  notiz: string;
  erstellt_von: string | null;
  erstellt_am: string;
}

// ── Import-Protokoll ────────────────────────────────────────────────────

export interface ImportProtokoll {
  id: string;
  quell_datei: string;
  status: string;
  bericht: Record<string, unknown>;
  importiert_am: string;
}

// ── Einschreibung (legacy compat) ───────────────────────────────────────

export interface Einschreibung {
  id: string;
  haendler_id: string;
  kurs_id: string;
  eingeschrieben_am: string;
}

// ── Helper type for quiz with full data ─────────────────────────────────

export type FrageMitAntworten = Frage & { antwortoptionen: Antwortoption[] };

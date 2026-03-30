// ── Rollen ────────────────────────────────────────────────────
export type Rolle = "admin" | "trainer" | "lernender";

// ── Haendler (User) ───────────────────────────────────────────
export interface Haendler {
  id: string;
  kundennummer: string;
  firmenname: string | null;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  rolle: Rolle;
  aktiv: boolean;
  erstellt_am: string;
}

// ── Kurs ──────────────────────────────────────────────────────
export type KursStatus = "entwurf" | "veroeffentlicht" | "archiviert";

export interface Kurs {
  id: string;
  titel: string;
  slug: string;
  beschreibung: string | null;
  bild_url: string | null;
  status: KursStatus;
  reihenfolge: number;
  dauer_min: number | null;
  zielgruppe: string | null;
  erstellt_am: string;
  geaendert_am: string;
  // computed
  lektionen_anzahl?: number;
}

// ── Lektion ───────────────────────────────────────────────────
export type LektionStatus = "entwurf" | "veroeffentlicht" | "archiviert";

export interface Lektion {
  id: string;
  kurs_id: string;
  titel: string;
  beschreibung: string | null;
  status: LektionStatus;
  reihenfolge: number;
  dauer_min: number | null;
  version: string;
  zielgruppe: string | null;
  erstellt_am: string;
  geaendert_am: string;
}

// ── Inhaltsblock ──────────────────────────────────────────────
export type BlockTyp = "text" | "bild" | "video" | "pdf" | "callout" | "schritte" | "quiz";

export interface Inhaltsblock {
  id: string;
  lektion_id: string;
  typ: BlockTyp;
  inhalt: Record<string, unknown>;
  reihenfolge: number;
  erstellt_am: string;
}

// ── Medium ────────────────────────────────────────────────────
export type MedienTyp = "bild" | "pdf" | "video" | "dokument";

export interface Medium {
  id: string;
  name: string;
  typ: MedienTyp;
  url: string;
  dateigröße: number | null;
  mime_type: string | null;
  hochgeladen_von: string | null;
  hochgeladen_am: string;
}

// ── Quiz ──────────────────────────────────────────────────────
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

// ── Frage ─────────────────────────────────────────────────────
export type FrageTyp = "single" | "multiple" | "bild";
export type InhaltStatus = "vollstaendig" | "in_pruefung" | "unvollstaendig" | "medien_fehlen";

export interface Frage {
  id: string;
  quiz_id: string;
  typ: FrageTyp;
  fragetext: string;
  erklaerung: string | null;
  media_id: string | null;
  reihenfolge: number;
  mehrere_korrekt: boolean;
  inhalt_status: InhaltStatus;
  erstellt_am: string;
  antwortoptionen?: Antwortoption[];
}

// ── Antwortoption ─────────────────────────────────────────────
export interface Antwortoption {
  id: string;
  frage_id: string;
  text: string | null;
  media_id: string | null;
  ist_korrekt: boolean;
  reihenfolge: number;
}

// ── Einschreibung ─────────────────────────────────────────────
export interface Einschreibung {
  id: string;
  haendler_id: string;
  kurs_id: string;
  eingeschrieben_am: string;
}

// ── Lernfortschritt ───────────────────────────────────────────
export type FortschrittStatus = "nicht_gestartet" | "in_bearbeitung" | "abgeschlossen";

export interface Lernfortschritt {
  id: string;
  haendler_id: string;
  lektion_id: string;
  status: FortschrittStatus;
  prozent: number;
  abgeschlossen_am: string | null;
}

// ── Quiz-Versuch ──────────────────────────────────────────────
export interface QuizVersuch {
  id: string;
  haendler_id: string;
  quiz_id: string;
  gestartet_am: string;
  abgeschlossen_am: string | null;
  punkte: number | null;
  max_punkte: number | null;
  bestanden: boolean | null;
}

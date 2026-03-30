export type DateiTyp = "pdf" | "video" | "link" | "text";

export interface Inhalt {
  id: string;
  bereich: string;
  titel: string;
  beschreibung: string | null;
  video_url: string | null;
  datei_url: string | null;
  datei_typ: DateiTyp | null;
  thumbnail_url: string | null;
  dauer_min: number | null;
  reihenfolge: number;
  aktiv: boolean;
}

export interface InhaltNeu {
  bereich: string;
  titel: string;
  beschreibung?: string;
  video_url?: string;
  datei_url?: string;
  datei_typ?: DateiTyp;
  thumbnail_url?: string;
  dauer_min?: number;
  reihenfolge?: number;
}

export const BEREICHE = [
  { id: "vertrieb",          label: "Vertrieb / Display" },
  { id: "einbauanleitungen", label: "Einbauanleitungen" },
  { id: "fehlersuche",       label: "Fehlersuche" },
] as const;

export type BereichId = (typeof BEREICHE)[number]["id"];

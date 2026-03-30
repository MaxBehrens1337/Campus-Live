// ============================================================================
// THITRONIK Campus – Doinstruct Seed Data (Modules 1–7)
// ============================================================================
// Source of truth for all migrated Doinstruct content.
// Used to generate SQL seeds and power admin import.
// ============================================================================

export type SeedQuellStatus = 'vollstaendig' | 'unvollstaendig' | 'medien_fehlen' | 'redaktion_pruefen';
export type SeedFrageTyp = 'single' | 'multiple' | 'bild';
export type SeedOptionTyp = 'text' | 'bild' | 'bild_mit_text' | 'platzhalter';

export interface SeedAntwort {
  text: string | null;
  ist_korrekt: boolean;
  option_typ: SeedOptionTyp;
  quell_status: SeedQuellStatus;
}

export interface SeedFrage {
  fragetext: string;
  typ: SeedFrageTyp;
  mehrere_korrekt: boolean;
  inhalt_status: SeedQuellStatus;
  notizen_redaktion?: string;
  antworten: SeedAntwort[];
}

export interface SeedModul {
  slug: string;
  titel: string;
  beschreibung: string;
  quell_status: SeedQuellStatus;
  quell_datei: string;
  hat_video: boolean;
  hat_bilder: boolean;
  fragen: SeedFrage[];
}

function a(text: string, korrekt = false): SeedAntwort {
  return { text, ist_korrekt: korrekt, option_typ: 'text', quell_status: 'vollstaendig' };
}

function aKorrekt(text: string): SeedAntwort {
  return a(text, true);
}

function aBild(text: string | null, korrekt: boolean): SeedAntwort {
  return { text, ist_korrekt: korrekt, option_typ: 'bild', quell_status: 'medien_fehlen' };
}

function aUnvollstaendig(): SeedAntwort {
  return { text: '[Antwort im Quell-Export nicht enthalten]', ist_korrekt: false, option_typ: 'text', quell_status: 'unvollstaendig' };
}

// ── MODULE 1: Allgemeinefragen ──────────────────────────────────────────────

const modul01: SeedModul = {
  slug: 'allgemeinefragen',
  titel: 'Allgemeine Fragen',
  beschreibung: 'Grundlegende Fragen rund um den Einbau und die Handhabung von THITRONIK Produkten.',
  quell_status: 'vollstaendig',
  quell_datei: 'doinstruct-allgemeinefragen',
  hat_video: false,
  hat_bilder: false,
  fragen: [
    {
      fragetext: 'Woher weiß ich, wie lange ich für den Einbau der THITRONIK Produkte benötige?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Die Einbaurichtzeiten finde ich auf der THITRONIK Website im Händler-Bereich.'),
        a('Ich frage einen Kollegen, der so etwas schon einmal gemacht hat.'),
        a('Ich plane erst einmal einen ganzen Tag ein und freue mich, wenn es schneller geht.'),
      ],
    },
    {
      fragetext: 'Wie lässt sich die Fahrzeugannahme/-übergabe zu einem angenehmen Erlebnis für alle Beteiligten machen?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Ich verwende die THITRONIK Arbeitskarte, um alle für die Fahrzeugübergabe wichtigen Punkte systematisch abzuarbeiten und zu dokumentieren.'),
        a('Kladde und Stift reichen völlig aus.'),
        a('Ich muss mir nichts aufschreiben; ich kann mir das alles einfach so merken.'),
        a('Ich gestalte die Fahrzeugannahme/-übergabe nach Gefühl und hoffe am Ende, dass ich nichts vergessen habe.'),
      ],
    },
    {
      fragetext: 'Woher weiß ich, ob ich beim vorliegenden Fahrzeug eine Zusatzhupe/Backup-Sirene verbauen muss?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Ich wähle das Fahrzeug im THITRONIK Konfigurator aus und ergänze das Produkt WiPro III safe.lock. Ist eine Zusatzhupe/Backup-Sirene erforderlich, werde ich darüber im Konfigurator informiert.'),
        a('Ich frage meine Kollegen, die schon einmal ein Alarmsystem in so ein Fahrzeug eingebaut haben.'),
        a('Jedes Fahrzeug, in das eine WiPro III safe.lock eingebaut wird, benötigt auch eine Zusatzhupe oder Backup-Sirene.'),
        a('Ich baue erst einmal eine WiPro III safe.lock ein, teste dann die Alarmfunktion und entscheide, ob der Alarm ohne Zusatzhupe/Backup-Sirene laut genug ist.'),
      ],
    },
    {
      fragetext: 'Wo wird die Status-LED angebracht?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('In den Einbauunterlagen zum jeweiligen Fahrzeug ist ein empfohlener Einbauort dokumentiert; man sollte aber immer vorab mit dem Kunden klären, ob es andere Wünsche gibt und dies ggf. auf der Arbeitskarte notieren.'),
        a('Wichtig ist, dass der Kunde die Status-LED vom Bett aus sehen kann.'),
        a('Ich bohre einfach an einer passenden Stelle ein Loch.'),
        a('Man benötigt keine Status-LED.'),
      ],
    },
    {
      fragetext: 'Woher weiß ich, welches Werkzeug ich für den Einbau benötige?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Im Abschnitt „Hilfsmittel/Werkzeuge" der jeweiligen Einbauanleitung.'),
        a('Das weiß man, sobald man einmal ein THITRONIK Alarmsystem verbaut hat.'),
        a('Das kann man im Servicehandbuch des jeweiligen Fahrzeugs nachlesen.'),
        a('Ich probiere einfach aus, welche Werkzeuge passen.'),
      ],
    },
  ],
};

// ── MODULE 2: Canbus ────────────────────────────────────────────────────────

const modul02: SeedModul = {
  slug: 'canbus',
  titel: 'CAN-Bus',
  beschreibung: 'Grundlagen zum CAN-Bus und dessen Bedeutung für die WiPro III.',
  quell_status: 'vollstaendig',
  quell_datei: 'doinstruct-canbus',
  hat_video: false,
  hat_bilder: false,
  fragen: [
    {
      fragetext: 'Was ist der CAN-Bus?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Das zentrale Steuersystem des Fahrzeugs.'),
        a('Die Zentralverriegelung des Fahrzeugs.'),
        a('Das Entertainmentsystem des Fahrzeugs.'),
      ],
    },
    {
      fragetext: 'Wozu benötigt die WiPro III den CAN-Bus?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Um auszuwerten, ob Türen geöffnet oder geschlossen sind.'),
        a('Um die Innenbeleuchtung einzuschalten.'),
        a('Zur Spannungsversorgung.'),
      ],
    },
    {
      fragetext: 'Wo werden Dir CAN-Bus überwachte Türen angezeigt?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Im Kombiinstrument.'),
        a('Im Display des Radios.'),
        a('Im Rückspiegel.'),
      ],
    },
    {
      fragetext: 'Wie kannst Du prüfen, welche Tür vom CAN-Bus überwacht wird?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Indem ich die Türen bei eingeschalteter Zündung öffne und im Kombiinstrument nachsehe.'),
        a('Ich muss das nicht prüfen, denn wenn eine Zentralverriegelung vorhanden ist, werden alle Türen vom CAN-Bus überwacht.'),
        a('Indem ich im Fahrzeugschein nachlese.'),
      ],
    },
    {
      fragetext: 'Wie kann ich eine Tür absichern, die nicht vom CAN-Bus überwacht wird?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Mit einem Funk-Magnetkontakt.'),
        a('Ausschließlich mit einem mechanischen Türkontakt.'),
        a('Gar nicht.'),
      ],
    },
  ],
};

// ── MODULE 3: Fahrzeugübergabe ──────────────────────────────────────────────

const modul03: SeedModul = {
  slug: 'fahrzeugubergabe',
  titel: 'Fahrzeugübergabe',
  beschreibung: 'Doinstruct Manager – Ablauf und Hilfsmittel für die Fahrzeugübergabe nach dem Einbau.',
  quell_status: 'vollstaendig',
  quell_datei: 'doinstruct-fahrzeugubergabe',
  hat_video: true,
  hat_bilder: false,
  fragen: [
    {
      fragetext: 'Was sollte nach jeder erfolgreichen Montage eines THITRONIK Systems als erstes erfolgen?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Ein Rundgang mit dem Kunden, um das Fahrzeug, um alle verbauten Komponenten vorzustellen.'),
        a('Eine ausgiebige Kaffeepause mit dem Kunden.'),
        a('Die Übergabe der Rechnung an den Kunden.'),
      ],
    },
    {
      fragetext: 'Welche Hilfsmittel kann ich nutzen, beispielsweise um für eine möglichst präzise Übergabe zu sorgen?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Die THITRONIK Kurzanleitungen'),
        a('Die Bordmappe des Fahrzeugs'),
        a('Den Kaufvertrag des Fahrzeugs'),
      ],
    },
    {
      fragetext: 'Welche zusätzlichen Informationen solltest Du immer auf den THITRONIK Kurzanleitungen vermerken?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Die Seriennummer des Produkts sowie Angaben, wie und wo das Produkt abgesichert ist.'),
        a('Die Artikelnummer des Produkts sowie Angaben, wie und wo das Produkt abgesichert ist.'),
        a('Die Seriennummer des Produkts und den Namen des Monteurs.'),
      ],
    },
    {
      fragetext: 'Wie können sich Kunden über weitere Funktionen und Nutzungsmöglichkeiten von THITRONIK Produkten informieren?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Über den THITRONIK Youtube-Kanal mit hilfreichen Anwender-Videos sowie Tipps und Tricks zur Pflege und Wartung.'),
        a('In den Katalogen der Großhändler.'),
        a('In den Gelben Seiten.'),
      ],
    },
    {
      fragetext: 'Welches Ziel musst Du unbedingt erreicht haben, wenn Du das Fahrzeug nach dem Einbau an Deinen Kunden übergeben hast?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Der Kunde muss die Bedienung des Alarmsystems komplett verstanden haben.'),
        a('Der Kunde muss wissen, dass die Produkte Made in Schleswig-Holstein sind.'),
        a('Der Kunde muss wissen, dass alle Bedienungsanleitungen auch von der THITRONIK Website heruntergeladen werden können.'),
      ],
    },
  ],
};

// ── MODULE 4: Fehlersuche ───────────────────────────────────────────────────

const modul04: SeedModul = {
  slug: 'fehlersuche',
  titel: 'Fehlersuche Quiz',
  beschreibung: 'Bildbasierte Fragen zur korrekten Installation und Fehlersuche bei THITRONIK Komponenten.',
  quell_status: 'medien_fehlen',
  quell_datei: 'doinstruct-fehlersuche',
  hat_video: false,
  hat_bilder: true,
  fragen: [
    {
      fragetext: 'Bei welchen UB2A-Gelverbindern liegt keine einwandfreie Installation vor?',
      typ: 'bild', mehrere_korrekt: true, inhalt_status: 'medien_fehlen',
      notizen_redaktion: 'Bildoptionen: 4 korrekt, 1 falsch. Bilder im Quell-Export als Referenzen vorhanden.',
      antworten: [
        aBild('Gelverbinder-Option 1', true), aBild('Gelverbinder-Option 2', true),
        aBild('Gelverbinder-Option 3', true), aBild('Gelverbinder-Option 4', true),
        aBild('Gelverbinder-Option 5 (korrekte Installation)', false),
      ],
    },
    {
      fragetext: 'Welche Funk-Magnetkontakte wurden korrekt installiert?',
      typ: 'bild', mehrere_korrekt: true, inhalt_status: 'medien_fehlen',
      notizen_redaktion: 'Bildoptionen: 2 korrekt, 5 falsch.',
      antworten: [
        aBild('Magnetkontakt 1 (korrekt)', true), aBild('Magnetkontakt 2 (korrekt)', true),
        aBild('Magnetkontakt 3', false), aBild('Magnetkontakt 4', false),
        aBild('Magnetkontakt 5', false), aBild('Magnetkontakt 6', false),
        aBild('Magnetkontakt 7', false),
      ],
    },
    {
      fragetext: 'Wie sollte die Verkabelung nach dem Einbau der Thitronik-Komponenten idealerweise nicht aussehen?',
      typ: 'bild', mehrere_korrekt: true, inhalt_status: 'medien_fehlen',
      notizen_redaktion: 'Bildoptionen: 5 korrekt (schlecht), 1 falsch (gut).',
      antworten: [
        aBild('Verkabelung 1 (schlecht)', true), aBild('Verkabelung 2 (schlecht)', true),
        aBild('Verkabelung 3 (schlecht)', true), aBild('Verkabelung 4 (schlecht)', true),
        aBild('Verkabelung 5 (schlecht)', true), aBild('Verkabelung 6 (korrekt)', false),
      ],
    },
    {
      fragetext: 'Wie darf die Verklebung der Funk-Magnetkontakte nicht erfolgen, damit Halt und Funktion dauerhaft sichergestellt sind?',
      typ: 'bild', mehrere_korrekt: true, inhalt_status: 'medien_fehlen',
      notizen_redaktion: 'Bildoptionen: 3 korrekt (falsche Verklebung), 1 falsch (korrekte Verklebung).',
      antworten: [
        aBild('Verklebung 1 (falsch)', true), aBild('Verklebung 2 (falsch)', true),
        aBild('Verklebung 3 (falsch)', true), aBild('Verklebung 4 (korrekt)', false),
      ],
    },
    {
      fragetext: 'Was gibt es bei der Funktion der beiden Tasten auf dem Funk-Handsender zu beachten?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Jeder Tastendruck führt den nächstlogischen Schritt aus – wahlweise mit oder ohne Ton.'),
        a('Die obere Taste dient ausschließlich zum Entschärfen...'),
        a('Die obere Taste entriegelt, die untere verriegelt...'),
        a('Die obere Taste sorgt für stillen Alarm...'),
      ],
    },
    {
      fragetext: 'Wo sollte das G.A.S. verbaut sein, damit es optimal funktioniert?',
      typ: 'bild', mehrere_korrekt: false, inhalt_status: 'medien_fehlen',
      notizen_redaktion: 'Bildoption 1 korrekt, Bildoption 2 falsch.',
      antworten: [
        aBild('G.A.S. Position 1 (korrekt)', true),
        aBild('G.A.S. Position 2 (falsch)', false),
      ],
    },
  ],
};

// ── MODULE 5: Funkzubehör ───────────────────────────────────────────────────

const modul05: SeedModul = {
  slug: 'funkzubehoer',
  titel: 'Funkzubehör',
  beschreibung: 'Anlernen und Konfigurieren des THITRONIK Funkzubehörs an die WiPro III.',
  quell_status: 'vollstaendig',
  quell_datei: 'doinstruct-funkzubehoer',
  hat_video: false,
  hat_bilder: false,
  fragen: [
    {
      fragetext: 'Was musst Du machen, nachdem Du alle Komponenten montiert hast?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Das gesamte Funk-Zubehör an die WiPro III anlernen.'),
        a('Mittagspause.'), a('Den Luftdruck kontrollieren.'),
      ],
    },
    {
      fragetext: 'Wie lernst Du das Funkzubehör idealerweise an?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Zusammen mit einer zweiten Person.'),
        a('Im Dunkeln.'), a('Allein nach Feierabend.'),
      ],
    },
    {
      fragetext: 'Was ist der erste Schritt zum Anlernen des Funkzubehörs?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Das Starten des Anlernmodus'),
        a('Das Abklemmen der Fahrzeugbatterie'), a('Das Einschalten der Zündung'),
      ],
    },
    {
      fragetext: 'Woran erkennst Du, dass der Anlernvorgang erfolgreich war?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Beispielsweise am Quittungston der WiPro III.'),
        a('An der grün leuchtenden LED.'), a('An der Meldung im Kombiinstrument.'),
      ],
    },
    {
      fragetext: 'Woran muss Du nach dem Anlernen des Funk-Zubehörs unbedingt denken?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Den Anlernmodus zu beenden.'),
        a('Die Zündung auszuschalten.'), a('Das Fahrzeug abzuschließen.'),
      ],
    },
  ],
};

// ── MODULE 6: Gelverbinder ──────────────────────────────────────────────────

const modul06: SeedModul = {
  slug: 'gelverbinder',
  titel: 'Gelverbinder',
  beschreibung: 'Korrekte Verarbeitung und Handhabung von Gelverbindern für sichere Kabelverbindungen.',
  quell_status: 'vollstaendig',
  quell_datei: 'doinstruct-gelverbinder',
  hat_video: true,
  hat_bilder: false,
  fragen: [
    {
      fragetext: 'Wozu dienen Gelverbinder?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Gelverbinder sorgen für eine sichere und dauerhafte Kabelverbindung.'),
        a('Mit Gelverbindern stellst Du eine Steckverbindung her.'),
        a('Mit Gelverbindern stellst Du eine gelötete Kabelverbindung her.'),
      ],
    },
    {
      fragetext: 'Welcher Bestandteil des Gelverbinders sorgt für einen besonders guten Schutz vor Korrosion?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Das im Gelverbinder enthaltene Silikongel.'),
        a('Der transparente Teil des Gehäuses.'), a('Die rostfreien Klingen.'),
      ],
    },
    {
      fragetext: 'Worauf solltest Du bei der Verarbeitung der Gelverbinder besonders achten?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Auf den korrekten, spannungsfreien Sitz der Kabel.'),
        a('Darauf, den Gelverbinder möglichst nah an vorhandenen Steckergehäusen platzieren.'),
        a('Darauf, den Gelverbinder horizontal auszurichten.'),
      ],
    },
    {
      fragetext: 'Worauf musst Du beim Crimpen von Gelverbindern stets achten?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Auf das einwandfreie Verriegeln des Gelverbinders, das durch ein Klicken hörbar ist.'),
        a('Darauf, den Gelverbinder so fest wie möglich zusammenzupressen.'),
        a('Du musst sicherstellen, dass möglichst viel Silikongel austritt.'),
      ],
    },
    {
      fragetext: 'Welches Werkzeug empfehlen wir für eine präzise und einfache Verarbeitung von Gelverbindern?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Eine Scotchlock-Zange.'), a('Einen Schraubstock.'), a('Einen Hammer.'),
      ],
    },
  ],
};

// ── MODULE 7: Grundlagen (PARTIALLY INCOMPLETE) ─────────────────────────────

const modul07: SeedModul = {
  slug: 'grundlagen',
  titel: 'Grundlagen',
  beschreibung: 'Grundwissen zum Umgang mit Einbauanleitungen und Vorbereitung auf den Einbau.',
  quell_status: 'unvollstaendig',
  quell_datei: 'doinstruct-grundlagen',
  hat_video: false,
  hat_bilder: false,
  fragen: [
    {
      fragetext: 'Welche Informationen brauchst Du, um die richtige Einbauanleitung auszuwählen?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Basisfahrzeugtyp, Baujahr'), a('Fahrgestellnummer'), a('Aufbauhersteller'),
      ],
    },
    {
      fragetext: 'Wo findest Du die richtige Einbauanleitung?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Im Händler-Bereich'), a('Im Werkstattordner'), a('In der Produktverpackung'),
      ],
    },
    {
      fragetext: 'Welchen Abschnitt der Einbauanleitung solltest Du Dir vor jeder Installation einer WiPro III aufmerksam durchlesen?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'unvollstaendig',
      notizen_redaktion: 'Antworten im Quell-Export nicht enthalten. Redaktionelle Ergänzung erforderlich.',
      antworten: [aUnvollstaendig()],
    },
    {
      fragetext: 'Wie ermittelst Du das Baujahr des Basisfahrzeugs (in Bezug auf die Einbauunterlagen), wenn Du Dir nicht sicher bist?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'unvollstaendig',
      notizen_redaktion: 'Antworten im Quell-Export nicht enthalten. Redaktionelle Ergänzung erforderlich.',
      antworten: [aUnvollstaendig()],
    },
    {
      fragetext: 'Was solltest Du immer vor Arbeiten an einem Kundenfahrzeug durchführen?',
      typ: 'single', mehrere_korrekt: false, inhalt_status: 'unvollstaendig',
      notizen_redaktion: 'Antworten im Quell-Export nicht enthalten. Redaktionelle Ergänzung erforderlich.',
      antworten: [aUnvollstaendig()],
    },
  ],
};

export const SEED_MODULE_1_7: SeedModul[] = [
  modul01, modul02, modul03, modul04, modul05, modul06, modul07,
];

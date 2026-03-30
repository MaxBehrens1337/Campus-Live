// ============================================================================
// THITRONIK Campus – Doinstruct Seed Data (Modules 8–13)
// ============================================================================

import type { SeedModul, SeedAntwort } from './seed-modules-1-7';

function a(text: string, korrekt = false): SeedAntwort {
  return { text, ist_korrekt: korrekt, option_typ: 'text', quell_status: 'vollstaendig' };
}
function aKorrekt(text: string): SeedAntwort { return a(text, true); }
function aBild(text: string | null, korrekt: boolean): SeedAntwort {
  return { text, ist_korrekt: korrekt, option_typ: 'bild', quell_status: 'medien_fehlen' };
}
function aUnvollstaendig(): SeedAntwort {
  return { text: '[Antwort im Quell-Export nicht enthalten]', ist_korrekt: false, option_typ: 'text', quell_status: 'unvollstaendig' };
}

// ── MODULE 8: Konfigurator ──────────────────────────────────────────────────

const modul08: SeedModul = {
  slug: 'konfigurator',
  titel: 'Konfigurator',
  beschreibung: 'Der THITRONIK Konfigurator: Kostenvoranschläge für Alarmsystem-Einbauten erstellen.',
  quell_status: 'vollstaendig', quell_datei: 'doinstruct-konfigurator',
  hat_video: true, hat_bilder: false,
  fragen: [
    { fragetext: 'Was ist der THITRONIK Konfigurator?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Werkzeug, um für einen Kunden einen präzisen, übersichtlichen und leicht verständlichen Kostenvoranschlag für den Einbau eines THITRONIK Alarmsystems zu erstellen.'),
        a('Nachrüstung von Fahrzeug-Elektronik'), a('Nachrüstung von Fahrzeugzubehör'),
      ] },
    { fragetext: 'Wo findest Du den THITRONIK Konfigurator?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Von jeder beliebigen Seite der THITRONIK Website über eine Schaltfläche oben links erreichbar.'),
        a('Über einen Link im Impressum.'), a('Über eine Schaltfläche oben rechts.'),
      ] },
    { fragetext: 'Werden im THITRONIK Konfigurator auch eventuell nötige Zubehörteile berücksichtigt?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Ja. Zubehörteile wie Umrüstplatinen werden berücksichtigt und mit ausgewählt oder zur Auswahl angeboten.'),
        a('Nein, Zubehör wird nicht berücksichtigt.'), a('Nein, Zubehör muss immer nachträglich manuell gewählt werden.'),
      ] },
    { fragetext: 'Kann der THITRONIK Konfigurator auch Preise für andere Länder, z. B. die Schweiz, anzeigen?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Ja. Du kannst den Endpreis über die Länderauswahl anzeigen.'),
        a('Nein, nur deutsche Netto-Preise.'), a('Nein, nur UVP Deutschland inkl. MwSt.'),
      ] },
    { fragetext: 'Kann ich meinem Kunden die Konfiguration nach der Beratung zukommen lassen?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Ja, z. B. über einen QR-Code am Ende der Konfiguration.'),
        a('Ergebnis ist nur am Bildschirm ablesbar.'), a('Ergebnis kann nicht gespeichert werden.'),
      ] },
  ],
};

// ── MODULE 9: Magnet und Montageadapter ─────────────────────────────────────

const modul09: SeedModul = {
  slug: 'montageadapter',
  titel: 'Magnet und Montageadapter',
  beschreibung: 'Korrekte Montage von Funk-Magnetkontakten mit Montageadaptern.',
  quell_status: 'vollstaendig', quell_datei: 'doinstruct-montageadapter',
  hat_video: false, hat_bilder: false,
  fragen: [
    { fragetext: 'Wozu benötigt man Montageadapter?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Zur korrekten Ausrichtung der Funk-Magnetkontakte und zur Schaffung einer geeigneten Klebefläche.'),
        a('Zum Ausgleich von Farbunterschieden'), a('Zur versteckten Montage'),
      ] },
    { fragetext: 'Wie befestigt man einen Montageadapter?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [ aKorrekt('Mit Schrauben.'), a('Wird geklebt.'), a('Ist magnetisch.') ] },
    { fragetext: 'Kannst Du den Montageadapter auch nutzen, um Abstände zu überbrücken?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Ja. Der Montageadapter kann für jede Art der Ausrichtung verwendet werden.'),
        a('Nein, nur für vertikale Ausrichtung.'), a('Nein, Abstand lässt sich nicht korrigieren.'),
      ] },
    { fragetext: 'Kann der Montageadapter zur Montage auf Dichtungen verwendet werden?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Ja. Der Montageadapter schafft dafür die benötigte Klebefläche.'),
        a('Nein, dadurch wird der Empfang eingeschränkt.'), a('Nein, der Höhenunterschied würde zu groß werden.'),
      ] },
    { fragetext: 'Sind die Montageadapter für die Montage der Funk-Magnetkontakte im Außenbereich geeignet?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Nein, da die Funk-Magnetkontakte nicht für den Außenbereich vorgesehen sind.'),
        a('Ja, da sie geschraubt werden.'), a('Ja, wenn spritzwassergeschützt montiert.'),
      ] },
  ],
};

// ── MODULE 10: MB-SprinterVS30 (PARTIALLY INCOMPLETE) ───────────────────────

const modul10: SeedModul = {
  slug: 'mb-sprinter-vs30',
  titel: 'Mercedes-Benz Sprinter VS30',
  beschreibung: 'Einbau der WiPro III safe.lock im Mercedes-Benz Sprinter VS30.',
  quell_status: 'unvollstaendig', quell_datei: 'doinstruct-mb-sprinter-vs30',
  hat_video: false, hat_bilder: false,
  fragen: [
    { fragetext: 'Welche Zahlen auf der Übersichtsseite „Werkstattunterlagen" geben an, wann eine Anleitung zuletzt geändert wurde?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [ aKorrekt('10/2025'), a('2018+') ] },
    { fragetext: 'Welche DIP-Schalterstellung muss ich wählen, wenn ich eine WiPro III safe.lock in einen Mercedes Sprinter VS30 einbaue?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [ aKorrekt('Alle Schalter auf OFF'), a('Nur Schalter 3 auf ON'), a('Nur Schalter 6 auf ON'), a('Schalter 6 und 3 auf ON') ] },
    { fragetext: 'Welche Seriennummer muss die Zentrale haben, damit sie verwendet werden kann?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [ aKorrekt('Seriennr. 1050-048'), a('Seriennr. 1050-999'), a('Seriennr. 1050-123'), a('Seriennr. 1050-007') ] },
    { fragetext: 'Woran erkenne ich, dass ein Fahrzeug Originaltüren hat und wo kann ich das nachlesen?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Wenn ein Fahrzeug Originaltüren hat, wird im Tacho angezeigt, wenn diese geöffnet sind.'),
        a('Ich kann mit dem Originalschlüssel ver- und entriegeln...'), a('Ich kann mit dem Fahrzeugschlüssel abschließen...'),
      ] },
    // Fragen 5–12: source_incomplete
    ...['Warum sollten Sie zusätzlich zum WiPro III safe.lock Alarmsystem eine Zusatzhupe einbauen?',
      'An welchen Pin musst du das rot-rosafarbene Kabel der WiPro III safe.lock für den Warnblinkeranschluss anschließen?',
      'An welcher Sicherung kann die Zündung für den Anschluss der WiPro III safe.lock abgegriffen werden?',
      'Was zeigt dieses Bild?',
      'Wir empfehlen in unseren Einbauanleitungen immer, vorab die Fahrzeuggegebenheiten zu kontrollieren. Warum ist das wichtig? (Zwei Antworten sind richtig.)',
      'Welche Farbe hat das Warnblinker-Kabel des Mercedes Sprinter VS30?',
      'Mein Kunde möchte eine Alarmanlage für seinen teilintegrierten Mercedes VS30 mit Eura-Mobil-Aufbau. Was muss ich als Monteur beachten?',
      'Was ist der THITRONIK Campingmodus?',
    ].map(fragetext => ({
      fragetext, typ: 'single' as const, mehrere_korrekt: false, inhalt_status: 'unvollstaendig' as const,
      notizen_redaktion: 'Antworten im Quell-Export nicht enthalten. Redaktionelle Ergänzung erforderlich.',
      antworten: [aUnvollstaendig()],
    })),
  ],
};

// ── MODULE 11: Pro-finder ───────────────────────────────────────────────────

const modul11: SeedModul = {
  slug: 'pro-finder',
  titel: 'Pro-finder',
  beschreibung: 'GPS-Ortung mit dem THITRONIK Pro-finder: Einbau, Ausrichtung und Konfiguration.',
  quell_status: 'vollstaendig', quell_datei: 'doinstruct-pro-finder',
  hat_video: true, hat_bilder: false,
  fragen: [
    { fragetext: 'Welche Hauptfunktion hat der Pro-finder?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [ aKorrekt('Die GPS-Ortung'), a('Die Fernsteuerung der Bewegungssensoren.'), a('Das Fernstarten des Motors.') ] },
    { fragetext: 'Welche Materialien dürfen den Pro-finder nicht abdecken, sofern keine externe GPS-Antenne angeschlossen ist?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [ aKorrekt('Stahl und Aluminium'), a('GFK und Kunststoff'), a('Holz und Glas') ] },
    { fragetext: 'Wie muss der Pro-finder ausgerichtet werden, wenn keine externe GPS-Antenne angeschlossen ist?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [ aKorrekt('Waagerecht mit blauem Aufkleber nach oben.'), a('Es spielt keine Rolle.'), a('Immer hochkant, GSM-Antenne nach oben.') ] },
    { fragetext: 'Was musst Du bedenken, um den besten Einbauort für den Pro-finder zu finden?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Versteckter Einbauort, korrekte Ausrichtung, zugleich erreichbar z. B. für SIM-Kartentausch.'),
        a('So unzugänglich und weit unten wie möglich.'), a('Möglichst auf dem Armaturenbrett.'),
      ] },
  ],
};

// ── MODULE 12: Test1 (Bild-/Bildtext-Antworten) ────────────────────────────

const modul12: SeedModul = {
  slug: 'thitronik-test1',
  titel: 'Thitronik Test 1',
  beschreibung: 'Praxistest mit Bild- und Textfragen zu häufigen Einbausituationen.',
  quell_status: 'vollstaendig', quell_datei: 'doinstruct-test1',
  hat_video: false, hat_bilder: true,
  fragen: [
    { fragetext: 'Warum lässt sich der Pro-finder nicht programmieren?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Der Pro-finder ist bereits programmiert und die SMS wurde nicht vom Hauptnutzer verschickt.'),
        a('Die Sim-Karte unterstützt keine SMS.'), a('Die Seriennummern wurden nicht eingetragen.'), a('Der Pro-finder unterstützt die Sim-Karte nicht.'),
      ] },
    { fragetext: 'Es wurde eine Zusatzsirene verbaut. Diese funktioniert nun, jedoch reagiert die Zentralverriegelung über den Handsender plötzlich nicht mehr. Woran kann das liegen?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Das vorgepinnte weiß/schwarze Kabel im WiPro-Stecker wurde ausgepinnt.'),
        a('Man kann keine Zusatzsirene nutzen.'), a('Nach Installation sind die ZV-Kabel erneut zu verbinden.'), a('Eine Überspannung ist entstanden.'),
      ] },
    { fragetext: 'Was gilt es beim Verbau des Funk-Magnetkontaktes auf diesem Foto als Beispiel zu beachten?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'medien_fehlen',
      notizen_redaktion: 'Frage enthält Foto-Referenz – Bild im Quell-Export nicht mitgeliefert.',
      antworten: [
        aKorrekt('Das Fenster muss fast komplett geöffnet werden, damit der Kontakt überhaupt reagieren kann.'),
        a('Kontakt muss an nicht beweglicher Seite montiert sein.'), a('Es sollten Montageadapter verwendet werden.'), a('An diesem Fenster sollte generell kein Kontakt verbaut werden.'),
      ] },
    { fragetext: 'Welche Antwort ist hier bei dem verbautem CO-Sensor korrekt?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'medien_fehlen',
      notizen_redaktion: 'Frage enthält Foto-Referenz – Bild im Quell-Export nicht mitgeliefert.',
      antworten: [
        aKorrekt('Der Sensor wurde falschherum montiert.'),
        a('Sensor hätte weiter oben montiert werden müssen.'), a('Der verbaute Sensor kann dort die Elektronik stören.'), a('Sensor muss am Boden montiert werden.'),
      ] },
    { fragetext: 'Welches Problem kann hier entstehen?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'medien_fehlen',
      notizen_redaktion: 'Frage enthält Foto-Referenz – Bild im Quell-Export nicht mitgeliefert.',
      antworten: [
        aKorrekt('Das Fahrzeug lässt sich nicht starten, da der Transponder nicht erkannt wird – Abstand zu groß.'),
        a('Der Transponder verhindert, dass die Umrüstplatine eingesetzt werden kann.'), a('Der Transponder befindet sich auf der Umrüstplatine von Thitronik.'), a('Ausschließlich der originale Transponder von der Fiat-Platine hat Funktion.'),
      ] },
    { fragetext: 'Welcher Gelverbinder wurde korrekt geschlossen?', typ: 'bild', mehrere_korrekt: false, inhalt_status: 'medien_fehlen',
      notizen_redaktion: 'Bild-Antwortoptionen im Quell-Export.',
      antworten: [
        aBild('Dieser ist korrekt verschlossen und auch die Kabelführung ist korrekt im Verbinder.', true),
        aBild('Diese sind korrekt verschlossen, er darf nicht ganz geschlossen sein.', false),
      ] },
  ],
};

// ── MODULE 13: WiPro ────────────────────────────────────────────────────────

const modul13: SeedModul = {
  slug: 'wipro',
  titel: 'WiPro',
  beschreibung: 'Montage und Inbetriebnahme der WiPro III Alarmzentrale.',
  quell_status: 'vollstaendig', quell_datei: 'doinstruct-wipro',
  hat_video: false, hat_bilder: false,
  fragen: [
    { fragetext: 'Womit sollte die WiPro III befestigt werden?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Mit dem an der WiPro III vorhandenen Klebepad.'), a('Mit Schrauben.'), a('Mit Gaffatape über das komplette Gehäuse/den Lautsprecher.'),
      ] },
    { fragetext: 'Worauf solltest Du vor dem Aufkleben der WiPro III achten?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [ aKorrekt('gereinigter / entfetteter Untergrund'), a('staubiger Untergrund'), a('schmieriger Untergrund') ] },
    { fragetext: 'Worauf musst Du beim Ausrichten der WiPro achten?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [ aKorrekt('nicht den Taster betätigen'), a('Kabelbinder um das Gehäuse'), a('Lautsprecher verdeckt') ] },
    { fragetext: 'Was ist generell beim Abschluss der Montage der WiPro III zu beachten?', typ: 'single', mehrere_korrekt: false, inhalt_status: 'vollstaendig',
      antworten: [
        aKorrekt('Alle Stecker des Basisfahrzeugs müssen wieder fest eingesteckt und verriegelt sein.'),
        a('Einige Stecker bleiben lose.'), a('Es spielt keine Rolle, wie Kabel und Stecker angeordnet sind, da der Kunde das später nicht sieht.'),
      ] },
  ],
};

export const SEED_MODULE_8_13: SeedModul[] = [
  modul08, modul09, modul10, modul11, modul12, modul13,
];

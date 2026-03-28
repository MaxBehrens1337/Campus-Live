import type { QuizQuestion } from "@/components/campus/mini-games/quiz-game";
import type { MemoryPair } from "@/components/campus/mini-games/memory-game";
import type { OrderingStep } from "@/components/campus/mini-games/ordering-game";
import type { TroubleshootNode } from "@/components/campus/mini-games/troubleshoot-game";
import type { ConfigProduct, ConfigScenario } from "@/components/campus/mini-games/configurator-game";

// ─── WiPro III Quiz ────────────────────────────────────────────────────────────
export const WIPRO3_QUIZ: QuizQuestion[] = [
  {
    id: "w1",
    question: "Wie schaltet sich der WiPro III automatisch scharf?",
    options: [
      "Per Tastendruck an der Zentrale",
      "Beim Verriegeln des Fahrzeugs per Fahrzeug-Bus",
      "Nach 5 Minuten Standzeit automatisch",
      "Nur per Funk-Handsender",
    ],
    correctIndex: 1,
    explanation: "Der WiPro III erkennt das Verriegeln des Fahrzeugs über den Fahrzeug-Bus und schaltet sich dadurch automatisch scharf.",
    points: 20,
  },
  {
    id: "w2",
    question: "Über welche Kanäle gibt der WiPro III Alarm?",
    options: [
      "Nur über die Sirene",
      "Sirene + App-Benachrichtigung",
      "Sirene + Hupe + Blinker",
      "SMS + Hupe",
    ],
    correctIndex: 2,
    explanation: "Der WiPro III aktiviert bei Alarm gleichzeitig die Sirene, die Fahrzeughupe und die Blinker.",
    points: 20,
  },
  {
    id: "w3",
    question: "Welche Sensoren überwacht der WiPro III per Fahrzeug-Bus?",
    options: ["Klappen und Fenster", "Türen des Fahrzeugs", "Alle Magnetkontakte", "Nur die Fahrertür"],
    correctIndex: 1,
    explanation: "Türen werden per Fahrzeug-Bus überwacht. Zusätzliche Klappen werden per Funk-Magnetkontakte gesichert.",
    points: 20,
  },
  {
    id: "w4",
    question: "Was sichert der Funk-Magnetkontakt ab?",
    options: [
      "Nur Aufbautüren",
      "Motorhaube und Kofferraum",
      "Zusätzliche Klappen und Fenster die nicht am Bus hängen",
      "Ausschließlich Heckklappen",
    ],
    correctIndex: 2,
    explanation: "Funk-Magnetkontakte sichern Elemente, die nicht am Fahrzeug-Bus angeschlossen sind, z.B. Dachluken, Staufächer.",
    points: 20,
  },
  {
    id: "w5",
    question: "Was ist der Vorteil des Vernetzungsmoduls in Kombination mit WiPro III?",
    options: [
      "Erhöht die Sirenlautstärke",
      "Ermöglicht App-Steuerung: Verriegeln/Entriegeln und optionale Wegfahrsperre",
      "Verdoppelt die Akkulaufzeit",
      "Aktiviert automatisch die Außenbeleuchtung",
    ],
    correctIndex: 1,
    explanation: "Das Vernetzungsmodul verbindet WiPro III mit Pro-finder und ermöglicht die App-Steuerung inkl. Wegfahrsperre.",
    points: 20,
  },
];

// ─── Vernetzungsmodul Memory ────────────────────────────────────────────────────
export const VERNETZUNG_MEMORY: MemoryPair[] = [
  { id: "p1", imageLabel: "WiPro III", nameLabel: "Funk-Alarmzentrale für Freizeitfahrzeuge", color: "#F97316" },
  { id: "p2", imageLabel: "Pro-finder", nameLabel: "GPS-Ortungsmodul mit SIM-Karte", color: "#3B82F6" },
  { id: "p3", imageLabel: "Vernetzungsmodul", nameLabel: "App-Steuerung & Wegfahrsperre", color: "#A855F7" },
  { id: "p4", imageLabel: "G.A.S.-pro III", nameLabel: "Premium-Gaswarner (Höhen + Tiefen)", color: "#22C55E" },
  { id: "p5", imageLabel: "NFC Modul", nameLabel: "Kontaktloses Ver-/Entriegeln per Karte", color: "#EAB308" },
  { id: "p6", imageLabel: "Funk-Kabelschleife", nameLabel: "Sichert externe Gegenstände per Kabel", color: "#EF4444" },
];

// ─── WiPro III Einbau Ordering ─────────────────────────────────────────────────
export const WIPRO3_EINBAU: OrderingStep[] = [
  { id: "s1", content: "Fahrzeugbatterie abklemmen", detail: "Sicherheit vor Kurzschluss beim Einbau" },
  { id: "s2", content: "Einbauort für Zentrale bestimmen (trocken, erschütterungsfrei)", detail: "Idealerweise hinter der Verkleidung" },
  { id: "s3", content: "Zentrale an Fahrzeug-Bus anschließen (CAN-Bus)" },
  { id: "s4", content: "Stromversorgung (+12V, GND) anklemmen", detail: "Abgesicherter Dauerplus" },
  { id: "s5", content: "Sirene montieren und anschließen", detail: "Außen am Fahrzeug, schwer zugänglich" },
  { id: "s6", content: "Funk-Magnetkontakte einlernen", detail: "Max. 8 Kontakte pro Zentrale" },
  { id: "s7", content: "Funktionstest: Scharf/Unscharf, Alarmauslösung", detail: "Alle Kanäle testen" },
  { id: "s8", content: "Fahrzeugbatterie anklemmen und Abschlusstest", detail: "Protokoll ausfüllen" },
];

// ─── G.A.S.-pro Einbau Ordering ────────────────────────────────────────────────
export const GAS_EINBAU: OrderingStep[] = [
  { id: "g1", content: "Einbauort bestimmen: Tiefgase → bodennah (max. 30 cm)", detail: "LPG/Propan ist schwerer als Luft" },
  { id: "g2", content: "Für Höhengase: Sensor in Atemhöhe montieren (CO₂-Sensor)", detail: "Ca. 150–170 cm Höhe" },
  { id: "g3", content: "12V Dauerplus und GND anschließen" },
  { id: "g4", content: "Alarmausgang an Lüftungsklappe oder WiPro III koppeln (optional)" },
  { id: "g5", content: "Einschalttest: Gaswarner einschalten, 60 Sek. Aufwärmphase abwarten" },
  { id: "g6", content: "Funktionstest mit Testgas durchführen", detail: "Zertifiziertes Testspray verwenden" },
  { id: "g7", content: "Kundenschulung: Alarm-Reset und Lüftungsmaßnahmen erklären" },
];

// ─── Fehlersuche WiPro III ─────────────────────────────────────────────────────
export const FEHLERSUCHE_WIPRO3_NODES: TroubleshootNode[] = [
  {
    id: "root",
    type: "question",
    content: "Was ist das Symptom?",
    options: [
      { label: "Alarm löst nicht aus", nextId: "no-alarm" },
      { label: "Alarm lässt sich nicht deaktivieren", nextId: "no-stop" },
      { label: "App zeigt keine Verbindung", nextId: "no-app" },
      { label: "Zentrale reagiert nicht auf Funk-Magnetkontakt", nextId: "no-sensor" },
    ],
  },
  {
    id: "no-alarm",
    type: "question",
    content: "Ist die Anlage scharf geschaltet (LED-Status grün)?",
    options: [
      { label: "Nein, LED zeigt rot/aus", nextId: "not-armed" },
      { label: "Ja, LED grün – kein Alarm", nextId: "armed-no-alarm" },
    ],
  },
  {
    id: "not-armed",
    type: "question",
    content: "Wurde das Fahrzeug korrekt verriegelt (per Fahrzeug-Bus)?",
    options: [
      { label: "Nein, manuell verriegelt", nextId: "sol-bus" },
      { label: "Ja, per Fernbedienung verriegelt – trotzdem nicht scharf", nextId: "bus-issue" },
    ],
  },
  {
    id: "sol-bus",
    type: "solution",
    content: "WiPro III scharf-schalten erfordert Verriegeln per OEM-Schlüssel oder Funk-Handsender (Fahrzeug-Bus Signal).",
    detail: "Manuelles Verriegeln erzeugt kein Bus-Signal. Kunde aufklären oder Funk-Handsender nutzen.",
  },
  {
    id: "bus-issue",
    type: "solution",
    content: "CAN-Bus Anbindung prüfen. Möglicherweise falsches Bus-Protokoll konfiguriert.",
    detail: "Fahrzeugspezifisches CAN-Bus Protokoll in der Zentrale neu einlernen.",
  },
  {
    id: "armed-no-alarm",
    type: "question",
    content: "Welcher Sensor wurde ausgelöst?",
    options: [
      { label: "Türöffnung – kein Alarm", nextId: "door-no-alarm" },
      { label: "Funk-Magnetkontakt – kein Alarm", nextId: "mag-no-alarm" },
    ],
  },
  {
    id: "door-no-alarm",
    type: "solution",
    content: "Tür-Überwachung über Fahrzeug-Bus prüfen. Bus-Protokoll möglicherweise fehlerhaft konfiguriert.",
    detail: "Software-Update oder Neueinlernvorgang durchführen.",
  },
  {
    id: "mag-no-alarm",
    type: "solution",
    content: "Funk-Magnetkontakt Batterie prüfen und Kontakt neu einlernen.",
    detail: "Einlernmodus: 3x Taste an der Zentrale drücken, dann Magnet öffnen/schließen.",
  },
  {
    id: "no-stop",
    type: "question",
    content: "Welches Deaktivierungsmittel wird verwendet?",
    options: [
      { label: "Funk-Handsender", nextId: "remote-fail" },
      { label: "NFC Karte/Armband", nextId: "nfc-fail" },
      { label: "App", nextId: "app-fail" },
    ],
  },
  {
    id: "remote-fail",
    type: "solution",
    content: "Funk-Handsender Batterie tauschen (CR2032). Falls kein Erfolg: Handsender neu einlernen.",
    detail: "Einlernmodus: Zentrale in Lernmodus versetzen, Taste am Handsender drücken.",
  },
  {
    id: "nfc-fail",
    type: "solution",
    content: "NFC-Modul Verbindung zur Zentrale prüfen. NFC-Tag ggf. neu einlernen.",
  },
  {
    id: "app-fail",
    type: "solution",
    content: "Internetverbindung und Vernetzungsmodul-Status prüfen. SIM-Karte aktiv (Telekom)?",
    detail: "Empfohlen: Telekom SIM mit Datentarif (4,95 EUR/Monat).",
  },
  {
    id: "no-app",
    type: "question",
    content: "Leuchtet die Status-LED am Vernetzungsmodul?",
    options: [
      { label: "Nein, keine LED", nextId: "no-power" },
      { label: "Ja, blinkt rot", nextId: "no-network" },
      { label: "Ja, leuchtet grün", nextId: "app-config" },
    ],
  },
  {
    id: "no-power",
    type: "solution",
    content: "Stromversorgung des Vernetzungsmoduls prüfen. 12V Dauerplus und GND kontrollieren.",
  },
  {
    id: "no-network",
    type: "solution",
    content: "SIM-Karte prüfen: Ist eine aktive SIM eingelegt? Empfohlen: Telekom (beste Netzabdeckung für Reisemobile).",
  },
  {
    id: "app-config",
    type: "solution",
    content: "Modul ist online. App-Konfiguration prüfen: Richtige Geräte-ID hinterlegt?",
    detail: "Geräte-ID auf dem Aufkleber des Vernetzungsmoduls ablesen und in der App eingeben.",
  },
  {
    id: "no-sensor",
    type: "solution",
    content: "Funk-Magnetkontakt einlernen: Batterie prüfen, Abstand zum festen Magnetteil (max. 8 mm), Kontakt neu einlernen.",
    detail: "Großes Teil am beweglichen Element (Klappe), kleines Teil am festen Rahmen.",
  },
];

// ─── Konfigurator Szenario ─────────────────────────────────────────────────────
export const THITRONIK_PRODUCTS: ConfigProduct[] = [
  {
    id: "wipro3",
    name: "WiPro III",
    description: "Funk-Alarmzentrale – Basis des Systems",
    category: "alarm",
    required: true,
  },
  {
    id: "pro-finder",
    name: "Pro-finder GPS",
    description: "GPS-Ortung per SIM-Karte (Telekom empfohlen)",
    category: "tracking",
    priceHint: "4,95 €/Monat",
  },
  {
    id: "vernetzung",
    name: "Vernetzungsmodul",
    description: "App-Steuerung, Wegfahrsperre",
    category: "networking",
    dependencies: ["wipro3", "pro-finder"],
  },
  {
    id: "gas-pro3",
    name: "G.A.S.-pro III",
    description: "Premium-Gaswarner (Höhen + Tiefen + CO₂)",
    category: "gas",
  },
  {
    id: "gas",
    name: "G.A.S.",
    description: "Basis-Gaswarner (nur Tiefengase)",
    category: "gas",
    incompatible: ["gas-pro3"],
  },
  {
    id: "tsa",
    name: "T.S.A. Funk-Rauchmelder",
    description: "Koppelbar ans Alarmsystem",
    category: "gas",
  },
  {
    id: "nfc",
    name: "NFC Modul",
    description: "Ver-/Entriegeln per Karte, Armband oder Tag",
    category: "accessory",
  },
  {
    id: "handsender",
    name: "Funk-Handsender",
    description: "Fernbedienung für WiPro III",
    category: "accessory",
  },
  {
    id: "magnetkontakt",
    name: "Funk-Magnetkontakt",
    description: "Für Klappen, Luken, Staufächer",
    category: "accessory",
  },
  {
    id: "kabelschleife",
    name: "Funk-Kabelschleife",
    description: "Sichert Fahrräder, Stühle, externe Gegenstände",
    category: "accessory",
  },
];

export const KONFIGURATOR_SCENARIO_SCHWIMMER: ConfigScenario = {
  id: "schwimmer",
  title: "Der Schwimmer",
  customerRequest:
    "Ich will mein Wohnmobil absichern. Ich gehe aber oft schwimmen – dann habe ich keinen Schlüssel dabei. Wie kann ich trotzdem auf- und absperren?",
  requiredProducts: ["wipro3", "nfc"],
  explanation:
    "WiPro III ist die Pflicht-Basis. Das NFC Modul ermöglicht kontaktloses Ver-/Entriegeln per Armband oder NFC-Tag – perfekt zum Schwimmen gehen, ohne Schlüssel.",
};

export const KONFIGURATOR_SCENARIO_VOLLSCHUTZ: ConfigScenario = {
  id: "vollschutz",
  title: "Der Vollschutz-Kunde",
  customerRequest:
    "Ich möchte maximale Sicherheit: Alarm, GPS-Ortung, App auf dem Handy und ich will auch meinen Fahrradträger absichern.",
  requiredProducts: ["wipro3", "pro-finder", "vernetzung", "kabelschleife"],
  explanation:
    "WiPro III + Pro-finder + Vernetzungsmodul bieten Alarm + GPS + App. Die Funk-Kabelschleife sichert den Fahrradträger bei Entnahme oder Durchtrennung.",
};

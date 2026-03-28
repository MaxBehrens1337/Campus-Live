"use client";

import { useRouter } from "next/navigation";
import { useStampBook } from "@/lib/stores/stamp-book";
import { toast } from "sonner";

import { QuizGame } from "./quiz-game";
import { MemoryGame } from "./memory-game";
import { OrderingGame } from "./ordering-game";
import { TroubleshootGame } from "./troubleshoot-game";
import { ConfiguratorGame } from "./configurator-game";
import { Whiteboard } from "./whiteboard";

import {
  WIPRO3_QUIZ,
  VERNETZUNG_MEMORY,
  WIPRO3_EINBAU,
  GAS_EINBAU,
  FEHLERSUCHE_WIPRO3_NODES,
  THITRONIK_PRODUCTS,
  KONFIGURATOR_SCENARIO_SCHWIMMER,
  KONFIGURATOR_SCENARIO_VOLLSCHUTZ,
} from "@/lib/game-content";

// ─── Game registry ────────────────────────────────────────────────────────────
// Maps stationId → game component config

type GameConfig =
  | { type: "quiz"; props: Omit<React.ComponentProps<typeof QuizGame>, "onComplete"> }
  | { type: "memory"; props: Omit<React.ComponentProps<typeof MemoryGame>, "onComplete"> }
  | { type: "ordering"; props: Omit<React.ComponentProps<typeof OrderingGame>, "onComplete"> }
  | { type: "troubleshoot"; props: Omit<React.ComponentProps<typeof TroubleshootGame>, "onComplete"> }
  | { type: "configurator"; props: Omit<React.ComponentProps<typeof ConfiguratorGame>, "onComplete"> }
  | { type: "whiteboard" };

const GAME_REGISTRY: Record<string, GameConfig> = {
  "wipro3-grundlagen": {
    type: "quiz",
    props: {
      title: "WiPro III – Grundlagen",
      subtitle: "Alarmsystem für Freizeitfahrzeuge",
      questions: WIPRO3_QUIZ,
    },
  },
  "vernetzung": {
    type: "memory",
    props: {
      title: "Thitronik Produkte",
      subtitle: "Produkt ↔ Beschreibung zuordnen",
      pairs: VERNETZUNG_MEMORY,
    },
  },
  "wipro3-einbau": {
    type: "ordering",
    props: {
      title: "WiPro III – Einbauanleitung",
      subtitle: "Schritte in die richtige Reihenfolge bringen",
      steps: WIPRO3_EINBAU,
    },
  },
  "gas-einbau": {
    type: "ordering",
    props: {
      title: "G.A.S.-pro III – Einbauanleitung",
      subtitle: "Korrekte Montagereihenfolge",
      steps: GAS_EINBAU,
    },
  },
  "fehlersuche": {
    type: "troubleshoot",
    props: {
      title: "Fehlersuche WiPro III",
      subtitle: "Symptom → Ursache → Lösung",
      symptom: "Alarm verhält sich unerwartet oder App zeigt keine Verbindung",
      nodes: FEHLERSUCHE_WIPRO3_NODES,
      rootId: "root",
    },
  },
  "konfigurator": {
    type: "configurator",
    props: {
      title: "Produktkonfigurator",
      subtitle: "Optimales Sicherheitspaket für den Kunden",
      products: THITRONIK_PRODUCTS,
      scenario: KONFIGURATOR_SCENARIO_SCHWIMMER,
    },
  },
  "konfigurator-vollschutz": {
    type: "configurator",
    props: {
      title: "Konfigurator – Vollschutz",
      subtitle: "Maximale Sicherheit konfigurieren",
      products: THITRONIK_PRODUCTS,
      scenario: KONFIGURATOR_SCENARIO_VOLLSCHUTZ,
    },
  },
  "whiteboard": {
    type: "whiteboard",
  },
};

// ─── Router component ─────────────────────────────────────────────────────────

interface GameRouterProps {
  stationId: string;
}

export function GameRouter({ stationId }: GameRouterProps) {
  const router = useRouter();
  const updateStamp = useStampBook((s) => s.updateStamp);

  const handleComplete = (score: number) => {
    updateStamp(stationId, "completed", score);
    toast.success(`Station abgeschlossen! ${score} Punkte`, {
      description: "Im Stempelheft als grün markiert.",
    });
    setTimeout(() => router.back(), 1500);
  };

  const config = GAME_REGISTRY[stationId];

  if (!config) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white/40">
        <div className="text-center space-y-2">
          <p className="text-lg">Station &ldquo;{stationId}&rdquo; nicht gefunden</p>
          <button
            onClick={() => router.back()}
            className="text-sm text-orange-400 hover:text-orange-300 cursor-pointer"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  if (config.type === "quiz") {
    return <QuizGame {...config.props} onComplete={handleComplete} />;
  }
  if (config.type === "memory") {
    return <MemoryGame {...config.props} onComplete={handleComplete} />;
  }
  if (config.type === "ordering") {
    return <OrderingGame {...config.props} onComplete={handleComplete} />;
  }
  if (config.type === "troubleshoot") {
    return <TroubleshootGame {...config.props} onComplete={handleComplete} />;
  }
  if (config.type === "configurator") {
    return <ConfiguratorGame {...config.props} onComplete={handleComplete} />;
  }
  if (config.type === "whiteboard") {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex flex-col">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/10 bg-[#111827]">
          <button
            onClick={() => router.back()}
            className="text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            ← Zurück
          </button>
          <span className="text-sm font-semibold text-white">Whiteboard</span>
        </div>
        <div className="flex-1 p-4">
          <Whiteboard className="h-full" />
        </div>
      </div>
    );
  }

  return null;
}

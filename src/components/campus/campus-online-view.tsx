"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ShoppingCart, Wrench, AlertTriangle, Settings } from "lucide-react";

const BEREICHE = [
  {
    id: "vertrieb",
    titel: "Vertrieb / Display",
    beschreibung:
      "Produktübersichten, Verkaufsargumente und Display-Materialien für Ihre Präsentation beim Kunden.",
    icon: ShoppingCart,
    farbe: "#1D3661",
  },
  {
    id: "einbauanleitungen",
    titel: "Einbauanleitungen",
    beschreibung:
      "Schritt-für-Schritt-Anleitungen für alle Thitronik Produkte – PKW, Motorrad und mehr.",
    icon: Wrench,
    farbe: "#3BA9D3",
  },
  {
    id: "fehlersuche",
    titel: "Fehlersuche",
    beschreibung:
      "Diagnosecodes, häufige Installationsfehler und Lösungshinweise auf einen Blick.",
    icon: AlertTriangle,
    farbe: "#AFCA05",
  },
];

export function CampusOnlineView() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      {/* Header */}
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center active:opacity-70"
            aria-label="Zurück"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Campus Online</h1>
        </div>

        {/* Admin shortcut */}
        <button
          onClick={() => router.push("./admin")}
          className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center active:opacity-70"
          aria-label="Admin"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-5 flex flex-col gap-4">
        <p className="text-sm text-[#666666]">
          Wählen Sie einen Bereich, um Schulungsinhalte zu öffnen.
        </p>

        {BEREICHE.map((bereich) => {
          const Icon = bereich.icon;
          return (
            <div
              key={bereich.id}
              className="bg-white rounded-[24px] p-6 flex flex-col gap-4"
            >
              {/* Icon + Titel */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${bereich.farbe}1A` }}
                >
                  <Icon className="w-6 h-6" style={{ color: bereich.farbe }} />
                </div>
                <h2 className="text-[18px] font-bold text-[#1D3661]">
                  {bereich.titel}
                </h2>
              </div>

              {/* Beschreibung */}
              <p className="text-sm text-[#666666] leading-relaxed">
                {bereich.beschreibung}
              </p>

              {/* Button */}
              <button
                onClick={() => router.push(`./online/${bereich.id}`)}
                className="h-[48px] rounded-[16px] bg-[#1D3661] text-white font-semibold text-sm w-full active:opacity-80 transition-opacity"
              >
                Öffnen
              </button>
            </div>
          );
        })}
      </main>
    </div>
  );
}

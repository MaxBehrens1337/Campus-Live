"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useStampBook } from "@/lib/stores/stamp-book";

const ISLANDS = [
  {
    id: "island-1",
    title: "Insel 1: Alarmsysteme",
    stations: [
      { id: "s1", title: "WiPro III Grundlagen" },
      { id: "s2", title: "Funk-Magnetkontakte" },
      { id: "s3", title: "Produktkonfigurator" },
    ],
  },
  {
    id: "island-2",
    title: "Insel 2: Ortung & Vernetzung",
    stations: [
      { id: "s4", title: "Pro-finder GPS" },
      { id: "s5", title: "Vernetzungsmodul & App" },
    ],
  },
  {
    id: "island-3",
    title: "Insel 3: Gaswarnung",
    stations: [
      { id: "s6", title: "G.A.S.-pro III" },
      { id: "s7", title: "Einbau-Reihenfolge" },
      { id: "s8", title: "Fehlersuche" },
    ],
  },
];

export function StampBookView() {
  const { isStationComplete, getCompletedCount } = useStampBook();

  const total = ISLANDS.reduce((acc, i) => acc + i.stations.length, 0);
  const completed = getCompletedCount();
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Progress summary */}
      <div className="bg-white rounded-[24px] p-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-[#666666] font-medium uppercase tracking-wide">
              Gesamtfortschritt
            </p>
            <p className="text-[28px] font-bold text-[#1D3661] leading-none mt-1">
              {pct}%
            </p>
          </div>
          <p className="text-sm text-[#666666]">
            {completed} / {total} Stationen
          </p>
        </div>
        <div className="h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#AFCA05] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Islands */}
      {ISLANDS.map((island) => {
        const islandCompleted = island.stations.every((s) =>
          isStationComplete(s.id)
        );
        const islandCount = island.stations.filter((s) =>
          isStationComplete(s.id)
        ).length;

        return (
          <div key={island.id} className="bg-white rounded-[24px] p-5">
            {/* Island header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1D3661]">
                {island.title}
              </h3>
              <span
                className="text-xs font-semibold rounded-[999px] px-2.5 py-1"
                style={{
                  background: islandCompleted ? "#AFCA0520" : "#F0F0F0",
                  color: islandCompleted ? "#6a7c03" : "#666666",
                }}
              >
                {islandCount}/{island.stations.length}
              </span>
            </div>

            {/* Station list */}
            <div className="flex flex-col gap-2">
              {island.stations.map((station) => {
                const done = isStationComplete(station.id);
                return (
                  <div
                    key={station.id}
                    className="flex items-center gap-3 py-2"
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-[#AFCA05] shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#CCCCCC] shrink-0" />
                    )}
                    <span
                      className="text-sm"
                      style={{
                        color: done ? "#999999" : "#111111",
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {station.title}
                    </span>
                    {done && (
                      <span className="ml-auto text-xs text-[#AFCA05] font-semibold">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

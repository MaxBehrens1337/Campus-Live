"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ChevronLeft, ChevronRight } from "lucide-react";
import { useStampBook } from "@/lib/stores/stamp-book";

interface IslandOverviewProps {
  version: string;
}

const ISLANDS = [
  {
    id: "island-1",
    title: "Insel 1: Alarmsysteme",
    stationCount: 3,
    stationIds: ["s1", "s2", "s3"],
  },
  {
    id: "island-2",
    title: "Insel 2: Ortung & Vernetzung",
    stationCount: 2,
    stationIds: ["s4", "s5"],
  },
  {
    id: "island-3",
    title: "Insel 3: Gaswarnung & Sicherheit",
    stationCount: 3,
    stationIds: ["s6", "s7", "s8"],
  },
];

export function IslandOverview({ version }: IslandOverviewProps) {
  const router = useRouter();
  const { isStationComplete, getCompletedCount } = useStampBook();

  const totalStations = ISLANDS.reduce((acc, i) => acc + i.stationCount, 0);
  const completedCount = getCompletedCount();
  const pct =
    totalStations > 0 ? Math.round((completedCount / totalStations) * 100) : 0;
  const allComplete = completedCount >= totalStations;

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      {/* Header */}
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center active:opacity-70"
          aria-label="Zurück"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Campus Live {version}</h1>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-4">
        {/* Progress card */}
        <div className="bg-white rounded-[24px] p-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-[#666666] font-medium uppercase tracking-wide">
                Fortschritt
              </p>
              <p className="text-[28px] font-bold text-[#1D3661] leading-none mt-1">
                {pct}%
              </p>
            </div>
            <p className="text-sm text-[#666666]">
              {completedCount} / {totalStations} Stationen
            </p>
          </div>
          <div className="h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#AFCA05] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Island cards */}
        {ISLANDS.map((island) => {
          const islandCompleted = island.stationIds.every((id) =>
            isStationComplete(id)
          );
          const islandProgress = island.stationIds.filter((id) =>
            isStationComplete(id)
          ).length;
          const islandPct =
            island.stationCount > 0
              ? Math.round((islandProgress / island.stationCount) * 100)
              : 0;

          return (
            <button
              key={island.id}
              onClick={() => router.push(`./${version}/${island.id}`)}
              className="bg-white rounded-[24px] p-5 text-left flex flex-col gap-3 active:opacity-75 transition-opacity"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1D3661]">
                  {island.title}
                </h3>
                {islandCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-[#AFCA05] shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#CCCCCC] shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#AFCA05] rounded-full"
                    style={{ width: `${islandPct}%` }}
                  />
                </div>
                <span className="text-xs text-[#666666] shrink-0">
                  {islandProgress}/{island.stationCount}
                </span>
                <ChevronRight className="w-4 h-4 text-[#CCCCCC] shrink-0" />
              </div>
            </button>
          );
        })}

        {/* All complete CTA */}
        {allComplete && (
          <div className="bg-white rounded-[24px] p-5 text-center border-2 border-[#AFCA05]">
            <p className="text-sm font-semibold text-[#6a7c03] mb-4">
              Alle Stationen abgeschlossen!
            </p>
            <button
              onClick={() => router.push(`./${version}/quiz`)}
              className="h-[52px] px-8 rounded-[16px] bg-[#1D3661] text-white font-semibold text-base active:opacity-80"
            >
              Quiz starten
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

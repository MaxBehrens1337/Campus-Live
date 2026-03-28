"use client";

import { GameRouter } from "@/components/campus/mini-games/game-router";

interface StationViewProps {
  version: string;
  islandId: string;
  stationId: string;
}

export function StationView({ stationId }: StationViewProps) {
  return <GameRouter stationId={stationId} />;
}

import { create } from "zustand";
import type { CampusStamp, StampStatus } from "@/types/campus";

interface StampBookState {
  stamps: CampusStamp[];
  setStamps: (stamps: CampusStamp[]) => void;
  updateStamp: (stationId: string, status: StampStatus, score?: number) => void;
  isStationComplete: (stationId: string) => boolean;
  getCompletedCount: () => number;
}

export const useStampBook = create<StampBookState>((set, get) => ({
  stamps: [],
  setStamps: (stamps) => set({ stamps }),
  updateStamp: (stationId, status, score) =>
    set((state) => ({
      stamps: state.stamps.map((s) =>
        s.station_id === stationId
          ? {
              ...s,
              status,
              score: score ?? s.score,
              completed_at:
                status === "completed" ? new Date().toISOString() : s.completed_at,
            }
          : s
      ),
    })),
  isStationComplete: (stationId) =>
    get().stamps.some(
      (s) => s.station_id === stationId && s.status === "completed"
    ),
  getCompletedCount: () =>
    get().stamps.filter((s) => s.status === "completed").length,
}));

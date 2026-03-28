import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CampusSession } from "@/types/campus";

interface CampusSessionState {
  session: CampusSession | null;
  setSession: (session: CampusSession) => void;
  clearSession: () => void;
}

export const useCampusSession = create<CampusSessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: "campus-session",
    }
  )
);

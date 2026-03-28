"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, Clock, Star, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameShellProps {
  title: string;
  subtitle?: string;
  totalPoints?: number;
  timeLimitSeconds?: number;
  onComplete: (score: number) => void;
  onExit?: () => void;
  children: (helpers: GameHelpers) => React.ReactNode;
}

export interface GameHelpers {
  addPoints: (pts: number) => void;
  setComplete: () => void;
  timeLeft: number;
  score: number;
}

export function GameShell({
  title,
  subtitle,
  totalPoints = 100,
  timeLimitSeconds = 600,
  onComplete,
  onExit,
  children,
}: GameShellProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (completed || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [completed, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 && !completed) {
      handleComplete();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleComplete = useCallback(() => {
    setCompleted(true);
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 600);
    onComplete(score);
  }, [score, onComplete]);

  const addPoints = useCallback((pts: number) => {
    setScore((s) => Math.min(s + pts, totalPoints));
  }, [totalPoints]);

  const setComplete = useCallback(() => handleComplete(), [handleComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timePercent = (timeLeft / timeLimitSeconds) * 100;
  const isUrgent = timeLeft < 60;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F1A]/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          {/* Back */}
          <button
            onClick={() => onExit ? onExit() : router.back()}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Zurück
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500 shrink-0" />
              <span className="font-semibold text-sm truncate">{title}</span>
            </div>
            {subtitle && (
              <p className="text-xs text-white/40 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
            <Star className="h-4 w-4 text-orange-400" />
            <span className="font-bold text-orange-300 tabular-nums text-sm">
              {score}
              <span className="text-white/30 font-normal">/{totalPoints}</span>
            </span>
          </div>

          {/* Timer */}
          <div className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 border text-sm tabular-nums font-mono",
            isUrgent
              ? "bg-red-500/10 border-red-500/30 text-red-400 ring-pulse"
              : "bg-white/5 border-white/10 text-white/70"
          )}>
            <Clock className={cn("h-4 w-4", isUrgent && "text-red-400")} />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <div
            className={cn(
              "h-full transition-all duration-1000",
              isUrgent ? "bg-red-500" : "bg-orange-500"
            )}
            style={{ width: `${timePercent}%` }}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main className={cn("flex-1 container mx-auto px-4 py-6", celebrating && "celebrate")}>
        {children({ addPoints, setComplete, timeLeft, score })}
      </main>

      {/* ── Completion overlay ── */}
      {completed && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="game-card p-8 max-w-sm w-full text-center space-y-4">
            <div className="text-5xl font-black text-orange-400 tabular-nums">
              {score}
              <span className="text-2xl text-white/40">/{totalPoints}</span>
            </div>
            <p className="text-white/60 text-sm">Punkte erreicht</p>
            <div className="flex flex-col gap-2">
              <button className="btn-brand w-full" onClick={() => router.back()}>
                Station abschließen
              </button>
              <button
                className="w-full py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors text-sm cursor-pointer"
                onClick={() => {
                  setScore(0);
                  setCompleted(false);
                  setTimeLeft(timeLimitSeconds);
                }}
              >
                Nochmal spielen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

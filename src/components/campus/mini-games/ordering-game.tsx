"use client";

import { useState, useCallback } from "react";
import { GripVertical, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameShell, type GameHelpers } from "./game-shell";

export interface OrderingStep {
  id: string;
  content: string;
  detail?: string;
}

interface OrderingGameProps {
  title: string;
  subtitle?: string;
  steps: OrderingStep[];           // in correct order
  onComplete: (score: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function OrderingContent({
  steps,
  helpers,
}: {
  steps: OrderingStep[];
  helpers: GameHelpers;
}) {
  const [items, setItems] = useState(() => shuffle(steps));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState<boolean[]>([]);

  const handleDragStart = (i: number) => setDragIndex(i);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetIdx: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === targetIdx) return;
      setItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(targetIdx, 0, moved);
        return next;
      });
      setDragIndex(targetIdx);
    },
    [dragIndex]
  );

  const handleDragEnd = () => setDragIndex(null);

  // Touch drag (swap on tap for mobile)
  const [touchSelected, setTouchSelected] = useState<number | null>(null);

  const handleTap = useCallback(
    (i: number) => {
      if (checked) return;
      if (touchSelected === null) {
        setTouchSelected(i);
      } else if (touchSelected === i) {
        setTouchSelected(null);
      } else {
        setItems((prev) => {
          const next = [...prev];
          [next[touchSelected], next[i]] = [next[i], next[touchSelected]];
          return next;
        });
        setTouchSelected(null);
      }
    },
    [touchSelected, checked]
  );

  const handleCheck = () => {
    const results = items.map((item, i) => item.id === steps[i].id);
    setCorrect(results);
    setChecked(true);
    const score = Math.round((results.filter(Boolean).length / steps.length) * 100);
    helpers.addPoints(score);
    setTimeout(() => helpers.setComplete(), 1500);
  };

  const allCorrect = checked && correct.every(Boolean);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-sm text-white/50 text-center">
        {touchSelected !== null
          ? "Tippen Sie auf eine andere Karte zum Tauschen"
          : "Ziehen Sie die Schritte in die richtige Reihenfolge"}
      </div>

      <div className="space-y-2.5">
        {items.map((item, i) => {
          const isSelected = touchSelected === i;
          const isCorrect = checked ? correct[i] : null;

          return (
            <div
              key={item.id}
              draggable={!checked}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              onClick={() => handleTap(i)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
                "select-none",
                !checked && "cursor-grab active:cursor-grabbing",
                !checked && !isSelected && "game-card hover:border-orange-500/40",
                isSelected && "border-orange-500 bg-orange-500/10",
                isCorrect === true && "border-green-500/60 bg-green-500/10",
                isCorrect === false && "border-red-500/60 bg-red-500/10",
                dragIndex === i && "opacity-50 scale-[0.97]",
              )}
            >
              {/* Number */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                isCorrect === true ? "bg-green-500 text-white" :
                isCorrect === false ? "bg-red-500 text-white" :
                isSelected ? "bg-orange-500 text-white" :
                "bg-white/10 text-white/50"
              )}>
                {isCorrect === true ? <CheckCircle2 className="h-4 w-4" /> :
                 isCorrect === false ? <XCircle className="h-4 w-4" /> :
                 i + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{item.content}</p>
                {item.detail && (
                  <p className="text-xs text-white/40 mt-0.5">{item.detail}</p>
                )}
              </div>

              {/* Drag handle */}
              {!checked && (
                <GripVertical className="h-4 w-4 text-white/20 shrink-0" />
              )}

              {/* Correct position hint */}
              {checked && !correct[i] && (
                <span className="text-xs text-red-400 shrink-0">
                  war {steps.findIndex((s) => s.id === item.id) + 1}.
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!checked && (
        <button className="btn-brand w-full flex items-center justify-center gap-2" onClick={handleCheck}>
          Reihenfolge prüfen
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {checked && (
        <div className={cn(
          "text-center text-sm font-semibold py-3 rounded-xl",
          allCorrect ? "text-green-400 bg-green-500/10" : "text-orange-400 bg-orange-500/10"
        )}>
          {allCorrect
            ? "Perfekt! Alle Schritte korrekt!"
            : `${correct.filter(Boolean).length} von ${steps.length} Schritten richtig`}
        </div>
      )}
    </div>
  );
}

export function OrderingGame({ title, subtitle, steps, onComplete }: OrderingGameProps) {
  return (
    <GameShell
      title={title}
      subtitle={subtitle}
      totalPoints={100}
      timeLimitSeconds={steps.length * 45}
      onComplete={onComplete}
    >
      {(helpers) => <OrderingContent steps={steps} helpers={helpers} />}
    </GameShell>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameShell, type GameHelpers } from "./game-shell";

export interface MemoryPair {
  id: string;
  imageLabel: string;    // shown on image card (product name or emoji-free icon)
  nameLabel: string;     // shown on name card
  color?: string;        // optional accent color
}

interface MemoryGameProps {
  title: string;
  subtitle?: string;
  pairs: MemoryPair[];
  onComplete: (score: number) => void;
}

interface Card {
  id: string;
  pairId: string;
  type: "image" | "name";
  label: string;
  color?: string;
  matched: boolean;
  flipped: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function MemoryContent({
  pairs,
  helpers,
}: {
  pairs: MemoryPair[];
  helpers: GameHelpers;
}) {
  const [cards, setCards] = useState<Card[]>(() =>
    shuffle([
      ...pairs.map((p) => ({
        id: `img-${p.id}`,
        pairId: p.id,
        type: "image" as const,
        label: p.imageLabel,
        color: p.color,
        matched: false,
        flipped: false,
      })),
      ...pairs.map((p) => ({
        id: `name-${p.id}`,
        pairId: p.id,
        type: "name" as const,
        label: p.nameLabel,
        color: p.color,
        matched: false,
        flipped: false,
      })),
    ])
  );

  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const ptsPerPair = Math.floor(100 / pairs.length);

  const allMatched = cards.every((c) => c.matched);

  useEffect(() => {
    if (allMatched) helpers.setComplete();
  }, [allMatched, helpers]);

  const handleFlip = useCallback(
    (cardId: string) => {
      if (locked) return;
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.matched || card.flipped) return;

      const newFlipped = [...flippedIds, cardId];
      setCards((cs) =>
        cs.map((c) => (c.id === cardId ? { ...c, flipped: true } : c))
      );
      setFlippedIds(newFlipped);

      if (newFlipped.length === 2) {
        setLocked(true);
        const [a, b] = newFlipped.map((id) => cards.find((c) => c.id === id)!);
        const isMatch = a.pairId === b.pairId && a.type !== b.type;

        setTimeout(() => {
          if (isMatch) {
            setCards((cs) =>
              cs.map((c) =>
                c.pairId === a.pairId ? { ...c, matched: true, flipped: true } : c
              )
            );
            helpers.addPoints(ptsPerPair);
          } else {
            setCards((cs) =>
              cs.map((c) =>
                newFlipped.includes(c.id) ? { ...c, flipped: false } : c
              )
            );
          }
          setFlippedIds([]);
          setLocked(false);
        }, 900);
      }
    },
    [cards, flippedIds, locked, helpers, ptsPerPair]
  );

  const matched = cards.filter((c) => c.matched && c.type === "image").length;
  const cols = pairs.length <= 4 ? 4 : pairs.length <= 6 ? 6 : 8;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-white/50">
        <span>{matched} / {pairs.length} Paare gefunden</span>
        <div className="flex gap-1">
          {pairs.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                i < matched ? "bg-green-500" : "bg-white/15"
              )}
            />
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div
        className={cn("grid gap-3")}
        style={{ gridTemplateColumns: `repeat(${Math.min(cols, pairs.length * 2)}, 1fr)` }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "memory-card aspect-square cursor-pointer",
              card.flipped && "flipped"
            )}
            onClick={() => handleFlip(card.id)}
          >
            <div className="memory-card-inner">
              {/* Front (hidden) */}
              <div className="memory-card-front game-card flex items-center justify-center">
                <Shield className="h-6 w-6 text-orange-500/40" />
              </div>

              {/* Back (content) */}
              <div
                className={cn(
                  "memory-card-back flex items-center justify-center p-2 text-center",
                  card.matched
                    ? "bg-green-500/20 border-2 border-green-500/60"
                    : "game-card border-2 border-orange-500/40"
                )}
              >
                {card.type === "image" ? (
                  <div className="space-y-1">
                    <div
                      className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: card.color ?? "rgba(249,115,22,0.3)" }}
                    >
                      {card.label.charAt(0)}
                    </div>
                    <p className="text-[10px] text-white/60 leading-tight">{card.label}</p>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-white leading-tight">{card.label}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemoryGame({ title, subtitle, pairs, onComplete }: MemoryGameProps) {
  return (
    <GameShell
      title={title}
      subtitle={subtitle}
      totalPoints={100}
      timeLimitSeconds={pairs.length * 30}
      onComplete={onComplete}
    >
      {(helpers) => <MemoryContent pairs={pairs} helpers={helpers} />}
    </GameShell>
  );
}

"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, ChevronRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameShell, type GameHelpers } from "./game-shell";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  points?: number;
}

interface QuizGameProps {
  title: string;
  subtitle?: string;
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

function QuizContent({
  questions,
  helpers,
}: {
  questions: QuizQuestion[];
  helpers: GameHelpers;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const pts = current?.points ?? Math.floor(100 / questions.length);

  const handleSelect = useCallback(
    (idx: number) => {
      if (answered) return;
      setSelected(idx);
      setAnswered(true);
      const correct = idx === current.correctIndex;
      setResults((r) => [...r, correct]);
      if (correct) helpers.addPoints(pts);
    },
    [answered, current, helpers, pts]
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      setFinished(true);
      helpers.setComplete();
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [isLast, helpers]);

  if (finished) return null;

  const progress = ((currentIdx) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < currentIdx
                ? results[i] ? "bg-green-500" : "bg-red-500"
                : i === currentIdx
                ? "bg-orange-500"
                : "bg-white/10"
            )}
          />
        ))}
        <span className="text-xs text-white/40 ml-2 shrink-0">
          {currentIdx + 1}/{questions.length}
        </span>
      </div>

      {/* Question card */}
      <div className="game-card p-6 space-y-6">
        <h2 className="text-xl font-semibold leading-relaxed text-white">
          {current.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {current.options.map((option, i) => {
            const isSelected = selected === i;
            const isCorrect = i === current.correctIndex;
            const showResult = answered;

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={answered}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer",
                  "flex items-center gap-3",
                  !showResult && "border-white/10 bg-white/5 hover:border-orange-500/40 hover:bg-orange-500/5",
                  showResult && isCorrect && "border-green-500/60 bg-green-500/10 text-green-300",
                  showResult && isSelected && !isCorrect && "border-red-500/60 bg-red-500/10 text-red-300",
                  showResult && !isSelected && !isCorrect && "border-white/5 bg-white/[0.02] text-white/30",
                )}
              >
                <span className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold",
                  !showResult && "border-white/20 text-white/40",
                  showResult && isCorrect && "border-green-500 bg-green-500 text-white",
                  showResult && isSelected && !isCorrect && "border-red-500 bg-red-500 text-white",
                  showResult && !isSelected && !isCorrect && "border-white/10 text-white/20",
                )}>
                  {showResult && isCorrect ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : showResult && isSelected && !isCorrect ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered && current.explanation && (
          <div className="flex gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-200">{current.explanation}</p>
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button
            onClick={handleNext}
            className="btn-brand w-full flex items-center justify-center gap-2"
          >
            {isLast ? "Quiz abschließen" : "Nächste Frage"}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Points indicator */}
      {answered && (
        <div className={cn(
          "text-center text-sm font-medium animate-bounce",
          selected === current.correctIndex ? "text-green-400" : "text-red-400"
        )}>
          {selected === current.correctIndex ? `+${pts} Punkte!` : "Leider falsch"}
        </div>
      )}
    </div>
  );
}

export function QuizGame({ title, subtitle, questions, onComplete }: QuizGameProps) {
  return (
    <GameShell
      title={title}
      subtitle={subtitle}
      totalPoints={questions.reduce((s, q) => s + (q.points ?? Math.floor(100 / questions.length)), 0)}
      timeLimitSeconds={questions.length * 60}
      onComplete={onComplete}
    >
      {(helpers) => <QuizContent questions={questions} helpers={helpers} />}
    </GameShell>
  );
}

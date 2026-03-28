"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameShell, type GameHelpers } from "./game-shell";

export interface TroubleshootNode {
  id: string;
  type: "question" | "solution" | "cause";
  content: string;
  detail?: string;
  options?: {
    label: string;
    nextId: string;
  }[];
}

interface TroubleshootGameProps {
  title: string;
  subtitle?: string;
  symptom: string;
  nodes: TroubleshootNode[];
  rootId: string;
  onComplete: (score: number) => void;
}

function TroubleshootContent({
  symptom,
  nodes,
  rootId,
  helpers,
}: {
  symptom: string;
  nodes: TroubleshootNode[];
  rootId: string;
  helpers: GameHelpers;
}) {
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const [path, setPath] = useState<string[]>([rootId]);
  const [solved, setSolved] = useState(false);

  const currentId = path[path.length - 1];
  const current = nodeMap[currentId];

  const handleOption = (nextId: string) => {
    setPath((p) => [...p, nextId]);
    const next = nodeMap[nextId];
    if (next?.type === "solution") {
      helpers.addPoints(Math.max(100 - (path.length - 1) * 10, 40));
      setSolved(true);
      setTimeout(() => helpers.setComplete(), 1800);
    }
  };

  const handleBack = () => {
    if (path.length > 1) setPath((p) => p.slice(0, -1));
  };

  const handleReset = () => {
    setPath([rootId]);
    setSolved(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Symptom banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-amber-400/70 uppercase tracking-wide font-semibold">Symptom</p>
          <p className="text-sm text-amber-200 font-medium mt-0.5">{symptom}</p>
        </div>
      </div>

      {/* Breadcrumb path */}
      {path.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {path.slice(0, -1).map((id, i) => (
            <span key={id} className="flex items-center gap-1.5">
              <span className="text-xs text-white/30 truncate max-w-[120px]">
                {nodeMap[id]?.content.substring(0, 30)}…
              </span>
              {i < path.length - 2 && (
                <ChevronRight className="h-3 w-3 text-white/20 shrink-0" />
              )}
            </span>
          ))}
        </div>
      )}

      {/* Current node */}
      {current && (
        <div className={cn(
          "game-card p-6 space-y-5",
          current.type === "solution" && "border-green-500/40 bg-green-500/5",
          current.type === "cause" && "border-amber-500/40 bg-amber-500/5",
        )}>
          {current.type === "solution" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Lösung gefunden</span>
              </div>
              <p className="text-white font-medium">{current.content}</p>
              {current.detail && (
                <p className="text-sm text-white/60">{current.detail}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-base font-semibold text-white leading-relaxed">
                {current.content}
              </p>
              {current.detail && (
                <p className="text-sm text-white/50">{current.detail}</p>
              )}

              {current.options && (
                <div className="space-y-2">
                  {current.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOption(opt.nextId)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium",
                        "border-white/10 bg-white/5 hover:border-orange-500/50 hover:bg-orange-500/5",
                        "transition-all duration-150 cursor-pointer flex items-center gap-2"
                      )}
                    >
                      <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-xs text-white/40 shrink-0">
                        {i + 1}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {path.length > 1 && !solved && (
          <button
            onClick={handleBack}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors text-sm cursor-pointer"
          >
            Zurück
          </button>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/70 transition-colors text-sm cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Neu starten
        </button>
      </div>

      {/* Step counter */}
      <p className="text-xs text-white/25 text-center">
        Schritt {path.length} — Je weniger Schritte, desto mehr Punkte
      </p>
    </div>
  );
}

export function TroubleshootGame({
  title,
  subtitle,
  symptom,
  nodes,
  rootId,
  onComplete,
}: TroubleshootGameProps) {
  return (
    <GameShell
      title={title}
      subtitle={subtitle}
      totalPoints={100}
      timeLimitSeconds={480}
      onComplete={onComplete}
    >
      {(helpers) => (
        <TroubleshootContent
          symptom={symptom}
          nodes={nodes}
          rootId={rootId}
          helpers={helpers}
        />
      )}
    </GameShell>
  );
}

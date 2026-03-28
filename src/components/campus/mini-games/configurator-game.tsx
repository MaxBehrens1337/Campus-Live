"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, Plus, Minus, Info, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameShell, type GameHelpers } from "./game-shell";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductId = string;

export interface ConfigProduct {
  id: ProductId;
  name: string;
  description: string;
  category: "alarm" | "tracking" | "networking" | "gas" | "accessory";
  required?: boolean;          // always selected
  dependencies?: ProductId[];  // needs these to be selected
  incompatible?: ProductId[];  // cannot be selected together
  priceHint?: string;
}

export interface ConfigScenario {
  id: string;
  title: string;
  customerRequest: string;
  requiredProducts: ProductId[];   // must be in solution
  forbiddenProducts?: ProductId[]; // must NOT be in solution
  explanation: string;
}

interface ConfiguratorGameProps {
  title: string;
  subtitle?: string;
  products: ConfigProduct[];
  scenario: ConfigScenario;
  onComplete: (score: number) => void;
}

const CATEGORY_LABELS: Record<ConfigProduct["category"], string> = {
  alarm:      "Alarmsystem",
  tracking:   "Ortung",
  networking: "Vernetzung",
  gas:        "Gaswarnung",
  accessory:  "Zubehör",
};

const CATEGORY_COLORS: Record<ConfigProduct["category"], string> = {
  alarm:      "text-orange-400 bg-orange-500/10 border-orange-500/20",
  tracking:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
  networking: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  gas:        "text-green-400 bg-green-500/10 border-green-500/20",
  accessory:  "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

function ConfiguratorContent({
  products,
  scenario,
  helpers,
}: {
  products: ConfigProduct[];
  scenario: ConfigScenario;
  helpers: GameHelpers;
}) {
  const required = products.filter((p) => p.required).map((p) => p.id);
  const [selected, setSelected] = useState<Set<ProductId>>(new Set(required));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; missing: string[]; extra: string[] } | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

  const toggleProduct = useCallback(
    (id: ProductId) => {
      if (submitted) return;
      const product = products.find((p) => p.id === id);
      if (product?.required) return;

      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
          // Auto-add dependencies
          product?.dependencies?.forEach((dep) => next.add(dep));
        }
        return next;
      });
    },
    [submitted, products]
  );

  const isDependencyViolated = (p: ConfigProduct) => {
    if (!selected.has(p.id)) return false;
    return p.dependencies?.some((dep) => !selected.has(dep)) ?? false;
  };

  const handleSubmit = () => {
    const sol = new Set(scenario.requiredProducts);
    const missing = scenario.requiredProducts.filter((id) => !selected.has(id));
    const extra = scenario.forbiddenProducts?.filter((id) => selected.has(id)) ?? [];
    const correct = missing.length === 0 && extra.length === 0;

    const score = Math.max(0, 100 - missing.length * 20 - extra.length * 15);
    helpers.addPoints(score);
    setResult({ correct, missing, extra });
    setSubmitted(true);
    setTimeout(() => helpers.setComplete(), 2000);
  };

  const byCategory = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, ConfigProduct[]>);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Scenario card */}
      <div className="game-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">Kundenszenario</span>
        </div>
        <h2 className="font-semibold text-white text-base">{scenario.title}</h2>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-sm text-white/70 italic leading-relaxed">
            &ldquo;{scenario.customerRequest}&rdquo;
          </p>
        </div>
      </div>

      {/* Products by category */}
      {(Object.keys(byCategory) as ConfigProduct["category"][]).map((cat) => (
        <div key={cat} className="space-y-2">
          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", CATEGORY_COLORS[cat])}>
            {CATEGORY_LABELS[cat]}
          </div>
          <div className="space-y-2">
            {byCategory[cat].map((product) => {
              const isSelected = selected.has(product.id);
              const depViolated = isDependencyViolated(product);
              const isRequired = product.required;

              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
                    !submitted && !isRequired && "cursor-pointer",
                    isRequired && "cursor-default",
                    isSelected
                      ? "border-orange-500/50 bg-orange-500/8"
                      : "border-white/8 bg-white/3 hover:border-white/20",
                    depViolated && "border-amber-500/50 bg-amber-500/5",
                    submitted && result?.missing.includes(product.id) && "border-red-500/40 bg-red-500/5",
                    submitted && isSelected && result?.correct && "border-green-500/40",
                  )}
                >
                  {/* Checkbox */}
                  <div className={cn(
                    "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                    isSelected ? "bg-orange-500 border-orange-500" : "border-white/20",
                    isRequired && "bg-orange-500/30 border-orange-500/50",
                  )}>
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{product.name}</span>
                      {isRequired && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                          Pflicht
                        </span>
                      )}
                      {product.priceHint && (
                        <span className="text-[10px] text-white/30">{product.priceHint}</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{product.description}</p>
                    {depViolated && (
                      <p className="text-xs text-amber-400 mt-1">
                        Benötigt: {product.dependencies?.map((d) => products.find((p) => p.id === d)?.name).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Info toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoveredInfo(hoveredInfo === product.id ? null : product.id);
                    }}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Info className="h-3.5 w-3.5 text-white/30" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-white/50 px-1">
        <span>{selected.size} Produkte ausgewählt</span>
        {!submitted && (
          <button className="btn-brand flex items-center gap-2 text-sm px-4 py-2.5" onClick={handleSubmit}>
            Konfiguration prüfen
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Result */}
      {submitted && result && (
        <div className={cn(
          "game-card p-5 space-y-3",
          result.correct ? "border-green-500/40" : "border-amber-500/40"
        )}>
          <div className="flex items-center gap-2">
            {result.correct ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-amber-400" />
            )}
            <span className={cn("font-semibold", result.correct ? "text-green-400" : "text-amber-400")}>
              {result.correct ? "Perfekte Konfiguration!" : "Fast richtig!"}
            </span>
          </div>
          <p className="text-sm text-white/70">{scenario.explanation}</p>
          {result.missing.length > 0 && (
            <div className="text-xs text-red-400">
              Fehlend: {result.missing.map((id) => products.find((p) => p.id === id)?.name).join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ConfiguratorGame({
  title,
  subtitle,
  products,
  scenario,
  onComplete,
}: ConfiguratorGameProps) {
  return (
    <GameShell
      title={title}
      subtitle={subtitle}
      totalPoints={100}
      timeLimitSeconds={480}
      onComplete={onComplete}
    >
      {(helpers) => (
        <ConfiguratorContent products={products} scenario={scenario} helpers={helpers} />
      )}
    </GameShell>
  );
}

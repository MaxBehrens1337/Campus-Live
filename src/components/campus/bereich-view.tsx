"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, Play, Link2, FileType, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Inhalt, DateiTyp } from "@/types/inhalte";
import { BEREICHE } from "@/types/inhalte";

const BEREICH_LABELS: Record<string, string> = Object.fromEntries(
  BEREICHE.map((b) => [b.id, b.label])
);

const TYP_ICON: Record<DateiTyp, React.ComponentType<{ className?: string }>> = {
  pdf:   FileType,
  video: Play,
  link:  Link2,
  text:  FileText,
};

const TYP_LABEL: Record<DateiTyp, string> = {
  pdf:   "PDF",
  video: "Video",
  link:  "Link",
  text:  "Artikel",
};

export function BereichView({ bereich }: { bereich: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [inhalte, setInhalte] = useState<Inhalt[]>([]);
  const [loading, setLoading] = useState(true);

  const bereichLabel = BEREICH_LABELS[bereich] ?? bereich;

  useEffect(() => {
    async function laden() {
      const { data } = await supabase
        .from("inhalte")
        .select("*")
        .eq("bereich", bereich)
        .eq("aktiv", true)
        .order("reihenfolge", { ascending: true });
      setInhalte(data ?? []);
      setLoading(false);
    }
    laden();
  }, [bereich]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div>
          <p className="text-xs text-white/60">Campus Online</p>
          <h1 className="text-base font-bold leading-tight">{bereichLabel}</h1>
        </div>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[24px] h-24 animate-pulse" />
            ))}
          </div>
        ) : inhalte.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-[20px] bg-white flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#CCCCCC]" />
            </div>
            <p className="text-sm font-semibold text-[#666666]">
              Noch keine Inhalte vorhanden
            </p>
            <p className="text-xs text-[#999999] mt-1">
              Inhalte können im Admin-Bereich hochgeladen werden.
            </p>
          </div>
        ) : (
          inhalte.map((inhalt) => {
            const typ = (inhalt.datei_typ ?? "text") as DateiTyp;
            const Icon = TYP_ICON[typ];
            return (
              <button
                key={inhalt.id}
                onClick={() => router.push(`./${bereich}/${inhalt.id}`)}
                className="bg-white rounded-[24px] p-5 text-left flex items-start gap-4 active:opacity-75 transition-opacity"
              >
                {/* Type icon */}
                <div className="w-12 h-12 rounded-[14px] bg-[#F0F0F0] flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-[#1D3661]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111111] leading-snug">
                    {inhalt.titel}
                  </p>
                  {inhalt.beschreibung && (
                    <p className="text-xs text-[#666666] mt-1 line-clamp-2 leading-relaxed">
                      {inhalt.beschreibung}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-medium text-[#3BA9D3]">
                      {TYP_LABEL[typ]}
                    </span>
                    {inhalt.dauer_min && (
                      <span className="flex items-center gap-1 text-xs text-[#999999]">
                        <Clock className="w-3 h-3" />
                        {inhalt.dauer_min} Min.
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </main>
    </div>
  );
}

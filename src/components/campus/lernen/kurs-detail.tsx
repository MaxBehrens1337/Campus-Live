"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, Circle, Clock, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCampusSession } from "@/lib/stores/campus-session";
import type { Kurs, Lektion, Lernfortschritt } from "@/types/lms";

export function KursDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const sb = createClient();
  const session = useCampusSession();
  const haendlerId = session.session?.registrationId;

  const [kurs, setKurs] = useState<Kurs | null>(null);
  const [lektionen, setLektionen] = useState<Lektion[]>([]);
  const [fortschritt, setFortschritt] = useState<Record<string, Lernfortschritt>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function laden() {
      const { data: k } = await sb.from("kurse").select("*").eq("slug", slug).single();
      if (!k) { setLoading(false); return; }
      setKurs(k);

      const { data: l } = await sb.from("lektionen").select("*")
        .eq("kurs_id", k.id).eq("status", "veroeffentlicht").order("reihenfolge");
      setLektionen(l ?? []);

      if (haendlerId && l && l.length > 0) {
        const { data: f } = await sb.from("lernfortschritt").select("*")
          .eq("haendler_id", haendlerId).in("lektion_id", l.map(x => x.id));
        const map: Record<string, Lernfortschritt> = {};
        (f ?? []).forEach(x => { map[x.lektion_id] = x; });
        setFortschritt(map);
      }
      setLoading(false);
    }
    laden();
  }, [slug]); // eslint-disable-line

  const abgeschlossen = lektionen.filter(l => fortschritt[l.id]?.status === "abgeschlossen").length;
  const prozent = lektionen.length > 0 ? Math.round((abgeschlossen / lektionen.length) * 100) : 0;

  if (loading) return <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#3BA9D3] border-t-transparent rounded-full animate-spin" /></div>;
  if (!kurs) return <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center p-8 text-center"><p className="text-sm text-[#666666]">Kurs nicht gefunden.</p></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      <header className="bg-[#1D3661] text-white px-5 pt-5 pb-6">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center mb-4">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[22px] font-bold leading-tight">{kurs.titel}</h1>
        {kurs.beschreibung && <p className="text-sm text-white/70 mt-1">{kurs.beschreibung}</p>}

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/60">Fortschritt</span>
            <span className="text-xs font-bold text-[#AFCA05]">{abgeschlossen}/{lektionen.length} Lektionen</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-[#AFCA05] rounded-full transition-all duration-500" style={{ width: `${prozent}%` }} />
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-3">
        {lektionen.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16 text-center">
            <p className="text-sm text-[#999999]">Noch keine Inhalte verfügbar.</p>
          </div>
        ) : lektionen.map((l, i) => {
          const f = fortschritt[l.id];
          const done = f?.status === "abgeschlossen";
          const inProgress = f?.status === "in_bearbeitung";
          return (
            <button key={l.id}
              onClick={() => router.push(`./lernen/${slug}/lektion/${l.id}`)}
              className="bg-white rounded-[20px] p-4 flex items-center gap-3 text-left active:opacity-75 transition-opacity">
              <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${done ? "bg-[#F5F9E0]" : "bg-[#F0F0F0]"}`}>
                {done
                  ? <CheckCircle2 className="w-5 h-5 text-[#AFCA05]" />
                  : inProgress
                  ? <PlayCircle className="w-5 h-5 text-[#3BA9D3]" />
                  : <span className="text-sm font-bold text-[#999999]">{i+1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111111] truncate">{l.titel}</p>
                {l.beschreibung && <p className="text-xs text-[#666666] mt-0.5 truncate">{l.beschreibung}</p>}
                {l.dauer_min && (
                  <span className="flex items-center gap-1 text-xs text-[#CCCCCC] mt-1">
                    <Clock className="w-3 h-3" />{l.dauer_min} Min.
                  </span>
                )}
              </div>
              {done ? <Circle className="w-5 h-5 text-[#AFCA05] shrink-0" /> : <ChevronLeft className="w-5 h-5 text-[#CCCCCC] shrink-0 rotate-180" />}
            </button>
          );
        })}
      </main>
    </div>
  );
}

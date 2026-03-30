"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, Clock, PlayCircle, ChevronRight, Trophy, BookOpen, Video, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Kurs, Lektion, Lernfortschritt } from "@/types/lms";
import { QuellStatusBadge } from "../media-placeholder";
import { ProgressRing } from "../ui/progress-ring";

export function KursDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const sb = createClient();

  const [kurs, setKurs] = useState<Kurs | null>(null);
  const [lektionen, setLektionen] = useState<Lektion[]>([]);
  const [fortschritt, setFortschritt] = useState<Record<string, Lernfortschritt>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function laden() {
      const { data: { user } } = await sb.auth.getUser();

      const { data: k } = await sb.from("kurse").select("*").eq("slug", slug).single();
      if (!k) { setLoading(false); return; }
      setKurs(k);

      const { data: l } = await sb.from("lektionen").select("*")
        .eq("kurs_id", k.id).eq("status", "veroeffentlicht").order("reihenfolge");
      setLektionen(l ?? []);

      if (user && l && l.length > 0) {
        const { data: f } = await sb.from("lernfortschritt").select("*")
          .eq("user_id", user.id).in("lektion_id", l.map(x => x.id));
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
  const isAllDone = prozent === 100;

  if (loading) return <div className="min-h-screen bg-[#0A111F] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#3BA9D3] border-t-transparent rounded-full animate-spin" /></div>;
  if (!kurs) return <div className="min-h-screen bg-[#0A111F] text-white flex items-center justify-center p-8 text-center"><p className="text-white/50">Kurs nicht gefunden.</p></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#0A111F] text-white overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#1D3661] opacity-30 blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[300px] h-[300px] rounded-full bg-[#3BA9D3] opacity-20 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="px-5 pt-6 pb-8">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all mb-6">
            <ChevronLeft className="w-5 h-5 text-white/80" />
          </button>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-[28px] font-bold leading-tight">{kurs.titel}</h1>
                  <QuellStatusBadge status={kurs.quell_status} />
                </div>
                {kurs.beschreibung && <p className="text-sm text-white/60 leading-relaxed mt-1">{kurs.beschreibung}</p>}
              </motion.div>

              {/* Meta */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-4 mt-6 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{kurs.fragen_anzahl} Fragen</span>
                {kurs.hat_video && <span className="flex items-center gap-1 text-[#3BA9D3]"><Video className="w-3.5 h-3.5" />Video</span>}
                {kurs.hat_bilder && <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" />Bildquiz</span>}
              </motion.div>
            </div>

            {/* Big Progress Ring */}
            <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 100 }} className="shrink-0">
              {isAllDone ? (
                <div className="w-[84px] h-[84px] rounded-full bg-[#AFCA05] flex items-center justify-center shadow-[0_0_30px_rgba(175,202,5,0.4)]">
                  <Trophy className="w-10 h-10 text-[#111111]" />
                </div>
              ) : (
                <ProgressRing progress={prozent} size={84} strokeWidth={6} color="#AFCA05" trackColor="rgba(255,255,255,0.1)" className="drop-shadow-lg" />
              )}
            </motion.div>
          </div>
        </header>

        <main className="flex-1 px-5 pb-10 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Inhalte ({abgeschlossen}/{lektionen.length})</h2>
          </div>

          {lektionen.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-[32px] border border-white/5 backdrop-blur-sm">
              <BookOpen className="w-12 h-12 text-white/20 mb-3" />
              <p className="text-sm text-white/50">Noch keine Lektionen verfügbar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {lektionen.map((l, i) => {
                const f = fortschritt[l.id];
                const done = f?.status === "abgeschlossen";
                const inProgress = f?.status === "in_bearbeitung";
                
                return (
                  <motion.button key={l.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`./${slug}/lektion/${l.id}`)}
                    className={`relative overflow-hidden bg-white/5 rounded-[24px] p-5 flex items-center gap-4 text-left border backdrop-blur-md transition-colors ${
                      done ? "border-[#AFCA05]/30 bg-[#AFCA05]/10" : inProgress ? "border-[#3BA9D3]/30 bg-[#3BA9D3]/10" : "border-white/10 hover:bg-white/10"
                    }`}>
                    
                    {/* Number / Status Icon */}
                    <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                      done ? "bg-[#AFCA05] text-[#111111]" : inProgress ? "bg-[#3BA9D3] text-white" : "bg-white/10 text-white/60"
                    }`}>
                      {done ? <CheckCircle2 className="w-6 h-6" />
                        : inProgress ? <PlayCircle className="w-6 h-6" />
                        : <span className="text-[15px] font-bold">{i+1}</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-[16px] leading-tight truncate ${done ? "text-white" : "text-white/90"}`}>{l.titel}</p>
                      {l.beschreibung && <p className="text-sm text-white/50 mt-1 line-clamp-2 leading-snug">{l.beschreibung}</p>}
                      {l.dauer_min && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40 mt-2">
                          <Clock className="w-3.5 h-3.5" />{l.dauer_min} Min.
                        </span>
                      )}
                    </div>
                    
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-white/50" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

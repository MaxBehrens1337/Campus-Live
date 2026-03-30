"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Video, ImageIcon, LogOut, Shield, ChevronRight, Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Kurs, Profil } from "@/types/lms";
import { QuellStatusBadge } from "./media-placeholder";
import { ProgressRing } from "./ui/progress-ring";

export function DashboardGrid() {
  const router = useRouter();
  const sb = createClient();

  const [kurse, setKurse] = useState<Kurs[]>([]);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [fortschrittMap, setFortschrittMap] = useState<Record<string, number>>({});

  useEffect(() => {
    async function laden() {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: p } = await sb.from("profiles").select("*").eq("id", user.id).single();
        setProfil(p);
      }

      const { data: k } = await sb.from("kurse").select("*").eq("status", "veroeffentlicht").order("reihenfolge");
      setKurse(k ?? []);

      if (user && k && k.length > 0) {
        const fortMap: Record<string, number> = {};
        for (const kurs of k) {
          const { data: lektionen } = await sb.from("lektionen").select("id").eq("kurs_id", kurs.id).eq("status", "veroeffentlicht");
          const lIds = (lektionen ?? []).map((l) => l.id);
          if (lIds.length === 0) { fortMap[kurs.id] = 0; continue; }
          const { data: fort } = await sb.from("lernfortschritt").select("status").eq("user_id", user.id).in("lektion_id", lIds);
          const done = (fort ?? []).filter((f) => f.status === "abgeschlossen").length;
          fortMap[kurs.id] = Math.max(0, Math.min(100, Math.round((done / lIds.length) * 100)));
        }
        setFortschrittMap(fortMap);
      }
      setLoading(false);
    }
    laden();
  }, []); // eslint-disable-line

  async function handleLogout() {
    await sb.auth.signOut();
    router.push("./login");
  }

  const isAdmin = profil?.rolle === "admin" || profil?.rolle === "editor";
  const gesamtProzent = kurse.length > 0 
    ? Math.round(Object.values(fortschrittMap).reduce((acc, val) => acc + val, 0) / kurse.length)
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#0A111F] text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#1D3661] opacity-40 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#CE132D] opacity-20 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-5 py-6">
          <div className="flex items-center justify-between mb-8">
            <ThitronikLogo />
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button onClick={() => router.push("./admin")} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all">
                  <Shield className="w-4 h-4 text-[#3BA9D3]" />
                </button>
              )}
              <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all">
                <LogOut className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[28px] font-bold leading-tight">
                Guten Tag{profil?.anzeigename ? `, ${profil.anzeigename}` : ""}!
              </motion.h1>
              <p className="text-sm text-white/50 mt-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#AFCA05]" /> Entdecke dein nächstes Modul
              </p>
            </div>
            {/* Overall Progress Gamification Bubble */}
            {!loading && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                <ProgressRing progress={gesamtProzent} size={56} strokeWidth={4} />
              </motion.div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-5 pb-8 flex flex-col gap-6">
          {/* Module list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Lernmodule</h2>
            </div>
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => <div key={i} className="bg-white/5 rounded-[24px] h-[104px] animate-pulse border border-white/5" />)}
              </div>
            ) : kurse.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 bg-white/5 rounded-[32px] border border-white/5 backdrop-blur-sm">
                <Trophy className="w-12 h-12 text-white/20 mb-3" />
                <p className="text-sm text-white/50">Noch keine Module verfügbar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {kurse.map((kurs, idx) => {
                  const progress = fortschrittMap[kurs.id] ?? 0;
                  const isDone = progress === 100;
                  return (
                    <motion.button
                      key={kurs.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`./lernen/${kurs.slug}`)}
                      className={`relative overflow-hidden rounded-[24px] p-5 flex items-center gap-4 text-left transition-all border ${
                        isDone ? "bg-[#AFCA05]/10 border-[#AFCA05]/30" : "bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md"
                      }`}
                    >
                      {/* Left: Progress/Icon */}
                      <div className="shrink-0 relative flex items-center justify-center w-[52px] h-[52px]">
                        {isDone ? (
                          <div className="w-full h-full rounded-full bg-[#AFCA05] flex items-center justify-center shadow-[0_0_15px_rgba(175,202,5,0.5)]">
                            <Trophy className="w-6 h-6 text-[#111111]" />
                          </div>
                        ) : (
                          <>
                            <ProgressRing progress={progress} size={52} strokeWidth={4} color="#3BA9D3" trackColor="rgba(255,255,255,0.1)" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[12px] font-bold text-white">{idx + 1}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[16px] font-bold text-white truncate">{kurs.titel}</p>
                          <QuellStatusBadge status={kurs.quell_status} />
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-white/40 font-semibold uppercase tracking-wider">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {kurs.fragen_anzahl} Fragen</span>
                          {kurs.hat_video && <span className="flex items-center gap-1 text-[#3BA9D3]"><Video className="w-3 h-3" /> Video</span>}
                          {kurs.hat_bilder && <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Bildquiz</span>}
                        </div>
                      </div>

                      <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-white/50" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ThitronikLogo() {
  return (
    <svg width="140" height="34" viewBox="0 0 180 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Thitronik">
      <path d="M10 38 L10 8 L34 22 Z" fill="#CE132D" />
      <text x="42" y="30" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="22" fill="#FFFFFF" letterSpacing="1">THITRONIK</text>
    </svg>
  );
}

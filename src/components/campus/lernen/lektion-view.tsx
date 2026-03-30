"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, PlayCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { setLektionAbgeschlossen, getQuizFuerLektion } from "@/lib/lms/queries";
import type { Lektion, Quiz, Inhaltsblock } from "@/types/lms";
import { MediaPlaceholder } from "../media-placeholder";

export function LektionView({ slug, lektionId }: { slug: string; lektionId: string }) {
  const router = useRouter();
  const sb = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [lektion, setLektion] = useState<Lektion | null>(null);
  const [bloecke, setBloecke] = useState<Inhaltsblock[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [abgeschlossen, setAbgeschlossen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    async function laden() {
      const { data: { user } } = await sb.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: l } = await sb.from("lektionen").select("*").eq("id", lektionId).single();
      setLektion(l);

      if (l) {
        const { data: b } = await sb.from("inhaltsbloecke")
          .select("*").eq("lektion_id", lektionId).order("reihenfolge");
        setBloecke(b ?? []);

        const q = await getQuizFuerLektion(lektionId);
        setQuiz(q);
      }

      if (user) {
        const { data: f } = await sb.from("lernfortschritt").select("status")
          .eq("user_id", user.id).eq("lektion_id", lektionId).single();
        setAbgeschlossen(f?.status === "abgeschlossen");
      }
      setLoading(false);
    }
    laden();
  }, [lektionId]); // eslint-disable-line

  async function markierenAbgeschlossen() {
    if (!userId) return;
    setMarking(true);
    await setLektionAbgeschlossen(userId, lektionId);
    setAbgeschlossen(true);
    setMarking(false);
    
    // Auto-scroll to quiz or next steps
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  if (loading) return <div className="min-h-screen bg-[#0A111F] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#3BA9D3] border-t-transparent rounded-full animate-spin" /></div>;
  if (!lektion) return <div className="min-h-screen bg-[#0A111F] text-white flex items-center justify-center"><p>Lektion nicht gefunden.</p></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#0A111F] text-white overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1D3661] opacity-30 blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="px-5 pt-6 pb-6 border-b border-white/5 bg-[#0A111F]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all">
              <ChevronLeft className="w-5 h-5 text-white/80" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1 truncate">{slug.replace(/-/g, " ")}</p>
              <h1 className="text-[18px] font-bold leading-tight truncate">{lektion.titel}</h1>
            </div>
            {abgeschlossen && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0 w-10 h-10 rounded-full bg-[#AFCA05]/20 flex items-center justify-center border border-[#AFCA05]/30">
                <ShieldCheck className="w-5 h-5 text-[#AFCA05]" />
              </motion.div>
            )}
          </div>
        </header>

        <main className="flex-1 px-5 py-8 flex flex-col gap-8 max-w-[800px] mx-auto w-full">
          
          {/* Blocks Renderer */}
          {bloecke.length === 0 ? (
            <div className="p-6 bg-white/5 rounded-[24px] border border-white/10 text-center">
              <p className="text-sm text-white/50 italic">Keine Inhalte vorhanden.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {bloecke.map((block, idx) => (
                <motion.div key={block.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  {block.typ === "text" && block.inhalt && (
                    <div className="prose prose-invert prose-p:leading-relaxed prose-p:text-white/80 prose-strong:text-white prose-a:text-[#3BA9D3] max-w-none text-[16px]" 
                         dangerouslySetInnerHTML={{ __html: block.inhalt.replace(/\n/g, "<br/>") }} />
                  )}
                  {block.typ === "video" && (
                    <div className="w-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
                      {/* Hier würde der Videoplayer sitzen, falls echtes Video da ist */}
                      <MediaPlaceholder typ="video" className="!rounded-none !border-0 bg-[#000000]/40 !min-h-[220px]" />
                    </div>
                  )}
                  {block.typ === "bild" && (
                    <div className="w-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
                      <MediaPlaceholder typ="bild" className="!rounded-none !border-0 bg-[#000000]/40 !min-h-[220px]" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Completion Section */}
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-4">
            <AnimatePresence>
              {!abgeschlossen ? (
                <motion.button 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  onClick={markierenAbgeschlossen} disabled={marking}
                  className="w-full h-[64px] rounded-[24px] bg-[#AFCA05] text-[#111111] font-bold text-[18px] disabled:opacity-40 hover:bg-[#C2DF0A] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(175,202,5,0.3)]">
                  <CheckCircle2 className="w-6 h-6" />
                  {marking ? "Wird gespeichert…" : "Gelesen & Verstanden"}
                </motion.button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-[64px] rounded-[24px] bg-[#AFCA05]/10 border border-[#AFCA05]/30 flex items-center justify-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#AFCA05]" />
                  <span className="font-bold text-[#AFCA05] text-[18px]">Lektion abgeschlossen</span>
                </motion.div>
              )}
            </AnimatePresence>

            {quiz && (
              <motion.button
                onClick={() => router.push(`./quiz/${quiz.id}`)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full relative overflow-hidden bg-gradient-to-r from-[#1D3661] to-[#254A8A] rounded-[24px] p-6 flex items-center gap-5 text-left border border-white/10 shadow-2xl">
                <div className="w-[52px] h-[52px] rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <PlayCircle className="w-7 h-7 text-[#AFCA05]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-[18px]">Quiz starten</p>
                  <p className="text-[13px] text-white/60 mt-1 font-medium">Bestehe mit mind. {quiz.mindestquote}%!</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 text-white/80 rotate-180" />
                </div>
              </motion.button>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

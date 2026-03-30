"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, XCircle, RotateCcw, Trophy, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getFragenMitAntworten, quizVersuchSpeichern, setLektionAbgeschlossen } from "@/lib/lms/queries";
import type { Quiz, FrageMitAntworten } from "@/types/lms";
import { MediaPlaceholder } from "../media-placeholder";
import { Confetti } from "../ui/confetti";
import { ProgressRing } from "../ui/progress-ring";

type Auswahl = Record<string, string[]>;

export function QuizView({ slug, quizId }: { slug: string; quizId: string }) {
  const router = useRouter();
  const sb = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [fragen, setFragen] = useState<FrageMitAntworten[]>([]);
  const [aktuelleFrageIdx, setAktuelleFrageIdx] = useState(0);
  const [auswahl, setAuswahl] = useState<Auswahl>({});
  const [phase, setPhase] = useState<"quiz" | "ergebnis">("quiz");
  const [ergebnis, setErgebnis] = useState<{ punkte: number; max: number; prozent: number; bestanden: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function laden() {
      const { data: { user } } = await sb.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: q } = await sb.from("quizze").select("*").eq("id", quizId).single();
      setQuiz(q);
      if (q) {
        const f = await getFragenMitAntworten(quizId);
        const sichtbar = f.filter(frage => frage.inhalt_status !== "unvollstaendig");
        setFragen(sichtbar);
      }
      setLoading(false);
    }
    laden();
  }, [quizId]); // eslint-disable-line

  function toggleAntwort(frageId: string, antwortId: string, mehrere: boolean) {
    setAuswahl(prev => {
      const current = prev[frageId] ?? [];
      if (mehrere) {
        return { ...prev, [frageId]: current.includes(antwortId) ? current.filter(x => x !== antwortId) : [...current, antwortId] };
      }
      return { ...prev, [frageId]: [antwortId] };
    });
  }

  async function handleAbschliessen() {
    if (!userId || !quiz) return;
    setSubmitting(true);

    let punkte = 0;
    const antworten: { frage_id: string; antwort_option_id: string; ist_korrekt: boolean }[] = [];

    fragen.forEach(frage => {
      const gewaehlte = auswahl[frage.id] ?? [];
      const korrekteIds = frage.antwortoptionen.filter(a => a.ist_korrekt).map(a => a.id);
      const istKorrekt = korrekteIds.length === gewaehlte.length && korrekteIds.every(id => gewaehlte.includes(id));
      if (istKorrekt) punkte++;
      gewaehlte.forEach(aId => {
        antworten.push({ frage_id: frage.id, antwort_option_id: aId, ist_korrekt: istKorrekt });
      });
    });

    const result = await quizVersuchSpeichern(userId, quizId, antworten, punkte, fragen.length, quiz.mindestquote);

    if (result.bestanden && quiz.lektion_id) {
      await setLektionAbgeschlossen(userId, quiz.lektion_id);
    }

    setErgebnis({ punkte, max: fragen.length, prozent: result.prozent, bestanden: result.bestanden });
    
    // Gamification Hook
    if (result.bestanden) {
      setShowConfetti(true);
    }

    setPhase("ergebnis");
    setSubmitting(false);
  }

  if (loading) return <div className="min-h-screen bg-[#0A111F] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#3BA9D3] border-t-transparent rounded-full animate-spin" /></div>;
  if (!quiz || fragen.length === 0) return <div className="min-h-screen bg-[#0A111F] text-white flex items-center justify-center p-8"><p className="text-white/50">Keine Fragen verfügbar.</p></div>;

  // ── Result view ───────────────────────────────────────────────
  if (phase === "ergebnis" && ergebnis) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A111F] text-white">
        <Confetti fire={showConfetti} type={ergebnis.prozent === 100 ? "fireworks" : "burst"} />
        
        <header className="px-5 py-4 flex items-center gap-3 bg-[#0A111F]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white/80" />
          </button>
          <h1 className="text-base font-bold">Quiz Ergebnis</h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8 max-w-[600px] mx-auto w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10 }}>
            {ergebnis.bestanden ? (
              <div className="relative">
                <div className="absolute inset-0 bg-[#AFCA05] blur-[50px] opacity-30 rounded-full" />
                <ProgressRing progress={ergebnis.prozent} size={140} strokeWidth={8} color="#AFCA05" className="relative z-10 drop-shadow-2xl" />
                <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-[#AFCA05] z-10" />
              </div>
            ) : (
              <div className="w-[140px] h-[140px] rounded-full border-8 border-[#CE132D] flex items-center justify-center bg-[#CE132D]/10">
                <XCircle className="w-14 h-14 text-[#CE132D]" />
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
            <p className="text-[48px] font-black leading-none tracking-tighter" style={{ color: ergebnis.bestanden ? "#AFCA05" : "#CE132D" }}>
              {ergebnis.prozent}%
            </p>
            <p className="text-[18px] font-bold text-white/90 mt-2">{ergebnis.punkte} von {ergebnis.max} Fragen richtig</p>
            <p className="text-sm text-white/50 mt-2 max-w-[280px] mx-auto leading-relaxed">
              {ergebnis.bestanden ? "Glückwunsch! Du hast das Quiz erfolgreich bestanden. Die Lektion ist abgeschlossen." : `Schade, nicht bestanden. Du benötigst mindestens ${quiz.mindestquote}%, um das Quiz abzuschließen.`}
            </p>
          </motion.div>

          {/* Per-question review */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="w-full flex flex-col gap-4 mt-4">
            {fragen.map((frage, i) => {
              const gewaehlte = auswahl[frage.id] ?? [];
              const korrekteIds = frage.antwortoptionen.filter(a => a.ist_korrekt).map(a => a.id);
              const istKorrekt = korrekteIds.length === gewaehlte.length && korrekteIds.every(id => gewaehlte.includes(id));
              return (
                <div key={frage.id} className={`bg-white/5 backdrop-blur-md rounded-[24px] p-5 border-l-4 ${istKorrekt ? "border-[#AFCA05]" : "border-[#CE132D]"}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${istKorrekt ? "bg-[#AFCA05]/20" : "bg-[#CE132D]/20"}`}>
                      {istKorrekt ? <CheckCircle2 className="w-4 h-4 text-[#AFCA05]" /> : <XCircle className="w-4 h-4 text-[#CE132D]" />}
                    </div>
                    <p className="text-[15px] font-semibold text-white/90 leading-snug">{i+1}. {frage.fragetext}</p>
                  </div>
                  {frage.erklaerung && <p className="text-[13px] text-white/50 italic ml-9 mt-2 p-3 bg-white/5 rounded-[12px]">💡 {frage.erklaerung}</p>}
                </div>
              );
            })}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full flex flex-col gap-3 mt-4">
            {!ergebnis.bestanden && (
              <button onClick={() => { setAuswahl({}); setAktuelleFrageIdx(0); setPhase("quiz"); setShowConfetti(false); }}
                className="h-[64px] rounded-[24px] bg-white/5 border border-white/10 text-white font-bold text-[18px] flex items-center justify-center gap-3 hover:bg-white/10 transition-colors">
                <RotateCcw className="w-5 h-5" /> Wiederholen
              </button>
            )}
            <button onClick={() => router.back()} className="h-[64px] rounded-[24px] bg-[#1D3661] text-white font-bold text-[18px] shadow-[0_10px_30px_rgba(29,54,97,0.5)] active:scale-95 transition-transform">
              Zurück zum Kurs
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ── Quiz view ─────────────────────────────────────────────────
  const frage = fragen[aktuelleFrageIdx];
  const istLetzte = aktuelleFrageIdx === fragen.length - 1;
  const hatAuswahl = (auswahl[frage.id] ?? []).length > 0;
  const istBildFrage = frage.typ === "bild";

  return (
    <div className="flex flex-col min-h-screen bg-[#0A111F] text-white overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#1D3661] opacity-40 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="px-5 py-4 border-b border-white/5 bg-[#0A111F]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1">
              <ChevronLeft className="w-5 h-5 text-white/80" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-bold truncate">{quiz.titel}</h1>
            </div>
            <span className="text-[13px] font-bold text-white/50 bg-white/10 px-3 py-1 rounded-full">{aktuelleFrageIdx + 1}/{fragen.length}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#3BA9D3] rounded-full transition-all duration-300"
              style={{ width: `${((aktuelleFrageIdx + 1) / fragen.length) * 100}%` }} />
          </div>
        </header>

        <main className="flex-1 p-5 flex flex-col gap-6 max-w-[800px] mx-auto w-full pt-8">
          {/* Question card */}
          <motion.div key={`q-${frage.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-md">
              <p className="text-[12px] text-[#3BA9D3] font-bold uppercase tracking-widest mb-3">
                {frage.typ === "single" ? "Wähle die richtige Antwort" : frage.typ === "bild" ? "Bildauswahl" : "Mehrauswahl möglich"}
              </p>
              <p className="text-[22px] font-bold text-white leading-tight">{frage.fragetext}</p>
              
              {frage.inhalt_status === "medien_fehlen" && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-[#B45309]/20 border border-[#B45309]/40 rounded-[12px]">
                  <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <p className="text-xs text-[#F59E0B]">Einzelne Medienbilder werden noch redaktionell ergänzt.</p>
                </div>
              )}
            </div>

            {/* Answer options */}
            <div className={istBildFrage ? "grid grid-cols-2 gap-4" : "flex flex-col gap-3"}>
              {[...frage.antwortoptionen].sort((a, b) => a.reihenfolge - b.reihenfolge).map((antw) => {
                const gewaehlt = (auswahl[frage.id] ?? []).includes(antw.id);
                const istPlatzhalter = antw.option_typ === "bild" || antw.option_typ === "platzhalter";

                if (istBildFrage && istPlatzhalter) {
                  return (
                    <button key={antw.id}
                      onClick={() => toggleAntwort(frage.id, antw.id, frage.mehrere_korrekt)}
                      className={`relative overflow-hidden rounded-[24px] border-2 transition-all active:scale-[0.98] ${gewaehlt ? "border-[#3BA9D3] shadow-[0_0_20px_rgba(59,169,211,0.3)]" : "border-white/10 hover:border-white/30"}`}>
                      <MediaPlaceholder typ="quiz_bild" titel={antw.text ?? undefined} className="rounded-none border-0 min-h-[140px] bg-black/40" />
                      {gewaehlt && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#3BA9D3] flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                }

                return (
                  <button key={antw.id}
                    onClick={() => toggleAntwort(frage.id, antw.id, frage.mehrere_korrekt)}
                    className={`w-full min-h-[72px] p-5 rounded-[24px] border-2 text-left transition-all active:scale-[0.98] flex items-center justify-between gap-4 ${
                      gewaehlt ? "border-[#3BA9D3] bg-[#3BA9D3]/10 shadow-[0_0_20px_rgba(59,169,211,0.2)]" : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}>
                    <p className={`text-[16px] font-medium leading-snug ${gewaehlt ? "text-white" : "text-white/80"}`}>{antw.text}</p>
                    <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      gewaehlt ? "border-[#3BA9D3] bg-[#3BA9D3]" : "border-white/20"
                    }`}>
                      {gewaehlt && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </main>

        <div className="p-5 flex gap-4 bg-[#0A111F]/80 backdrop-blur-xl border-t border-white/5 pb-8">
          {aktuelleFrageIdx > 0 && (
            <button onClick={() => setAktuelleFrageIdx(i => i - 1)}
              className="flex-1 max-w-[120px] h-[64px] rounded-[24px] border border-white/10 text-white/60 font-semibold hover:bg-white/5 transition-colors">
              Zurück
            </button>
          )}
          {!istLetzte ? (
            <button onClick={() => setAktuelleFrageIdx(i => i + 1)} disabled={!hatAuswahl}
              className="flex-1 h-[64px] rounded-[24px] bg-[#3BA9D3] text-white font-bold text-[18px] disabled:opacity-40 shadow-[0_10px_30px_rgba(59,169,211,0.3)] active:scale-95 transition-all">
              Weiter
            </button>
          ) : (
            <button onClick={handleAbschliessen} disabled={!hatAuswahl || submitting}
              className="flex-1 h-[64px] rounded-[24px] bg-[#AFCA05] text-[#111111] font-bold text-[18px] disabled:opacity-40 shadow-[0_10px_30px_rgba(175,202,5,0.3)] active:scale-95 transition-all">
              {submitting ? "Auswerten…" : "Quiz abschließen"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

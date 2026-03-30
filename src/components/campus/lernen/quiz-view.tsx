"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCampusSession } from "@/lib/stores/campus-session";
import { getFragenMitAntworten, quizVersuchSpeichern, setLektionAbgeschlossen } from "@/lib/lms/queries";
import type { Quiz, Frage, Antwortoption } from "@/types/lms";

type Auswahl = Record<string, string[]>; // frage_id → antwort_option_ids[]

export function QuizView({ slug, quizId }: { slug: string; quizId: string }) {
  const router = useRouter();
  const sb = createClient();
  const session = useCampusSession();
  const haendlerId = session.session?.registrationId;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [fragen, setFragen] = useState<(Frage & { antwortoptionen: Antwortoption[] })[]>([]);
  const [aktuelleFrageIdx, setAktuelleFrageIdx] = useState(0);
  const [auswahl, setAuswahl] = useState<Auswahl>({});
  const [phase, setPhase] = useState<"quiz" | "ergebnis">("quiz");
  const [ergebnis, setErgebnis] = useState<{ punkte: number; max: number; prozent: number; bestanden: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function laden() {
      const { data: q } = await sb.from("quizze").select("*").eq("id", quizId).single();
      setQuiz(q);
      if (q) {
        const f = await getFragenMitAntworten(quizId);
        setFragen(f as (Frage & { antwortoptionen: Antwortoption[] })[]);
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
      } else {
        return { ...prev, [frageId]: [antwortId] };
      }
    });
  }

  async function handleAbschliessen() {
    if (!haendlerId || !quiz) return;
    setSubmitting(true);

    let punkte = 0;
    const antworten: { frage_id: string; antwort_option_id: string; ist_korrekt: boolean }[] = [];

    fragen.forEach(frage => {
      const gewaehlte = auswahl[frage.id] ?? [];
      const korrekteIds = frage.antwortoptionen.filter(a => a.ist_korrekt).map(a => a.id);
      const istKorrekt =
        korrekteIds.length === gewaehlte.length &&
        korrekteIds.every(id => gewaehlte.includes(id));
      if (istKorrekt) punkte++;
      gewaehlte.forEach(aId => {
        antworten.push({ frage_id: frage.id, antwort_option_id: aId, ist_korrekt: istKorrekt });
      });
    });

    const result = await quizVersuchSpeichern(haendlerId, quizId, antworten, punkte, fragen.length, quiz.mindestquote);

    if (result.bestanden && quiz.lektion_id) {
      await setLektionAbgeschlossen(haendlerId, quiz.lektion_id);
    }

    setErgebnis({ punkte, max: fragen.length, prozent: result.prozent, bestanden: result.bestanden });
    setPhase("ergebnis");
    setSubmitting(false);
  }

  if (loading) return <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#3BA9D3] border-t-transparent rounded-full animate-spin" /></div>;
  if (!quiz || fragen.length === 0) return <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center p-8 text-center"><p className="text-sm text-[#666666]">Keine Fragen verfügbar.</p></div>;

  // ── Ergebnisansicht ──────────────────────────────────────────
  if (phase === "ergebnis" && ergebnis) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
        <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">Ergebnis</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${ergebnis.bestanden ? "bg-[#F5F9E0]" : "bg-[#FEF0F2]"}`}>
            {ergebnis.bestanden
              ? <Trophy className="w-12 h-12 text-[#AFCA05]" />
              : <XCircle className="w-12 h-12 text-[#CE132D]" />}
          </div>
          <div className="text-center">
            <p className="text-[40px] font-bold" style={{ color: ergebnis.bestanden ? "#AFCA05" : "#CE132D" }}>
              {ergebnis.prozent}%
            </p>
            <p className="text-base font-semibold text-[#111111] mt-1">
              {ergebnis.punkte} von {ergebnis.max} Fragen richtig
            </p>
            <p className="text-sm text-[#666666] mt-1">
              {ergebnis.bestanden ? "Bestanden! Die Lektion wurde als abgeschlossen markiert." : `Nicht bestanden. Mindestens ${quiz.mindestquote}% erforderlich.`}
            </p>
          </div>

          {/* Auswertung */}
          <div className="w-full flex flex-col gap-3">
            {fragen.map((frage, i) => {
              const gewaehlte = auswahl[frage.id] ?? [];
              const korrekteIds = frage.antwortoptionen.filter(a => a.ist_korrekt).map(a => a.id);
              const istKorrekt = korrekteIds.length === gewaehlte.length && korrekteIds.every(id => gewaehlte.includes(id));
              return (
                <div key={frage.id} className={`bg-white rounded-[20px] p-4 border-l-4 ${istKorrekt ? "border-[#AFCA05]" : "border-[#CE132D]"}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {istKorrekt ? <CheckCircle2 className="w-4 h-4 text-[#AFCA05] shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-[#CE132D] shrink-0 mt-0.5" />}
                    <p className="text-sm font-semibold text-[#111111]">{i+1}. {frage.fragetext}</p>
                  </div>
                  {frage.erklaerung && <p className="text-xs text-[#666666] italic ml-6">💡 {frage.erklaerung}</p>}
                </div>
              );
            })}
          </div>

          <div className="w-full flex flex-col gap-3">
            {!ergebnis.bestanden && (
              <button onClick={() => { setAuswahl({}); setAktuelleFrageIdx(0); setPhase("quiz"); }}
                className="h-[52px] rounded-[16px] border-2 border-[#1D3661] text-[#1D3661] font-bold flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> Wiederholen
              </button>
            )}
            <button onClick={() => router.back()}
              className="h-[52px] rounded-[16px] bg-[#1D3661] text-white font-bold">
              Zurück zum Kurs
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Quiz-Ansicht ─────────────────────────────────────────────
  const frage = fragen[aktuelleFrageIdx];
  const istLetzte = aktuelleFrageIdx === fragen.length - 1;
  const hatAuswahl = (auswahl[frage.id] ?? []).length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      <header className="bg-[#1D3661] text-white px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold flex-1 truncate">{quiz.titel}</h1>
          <span className="text-sm text-white/60">{aktuelleFrageIdx + 1}/{fragen.length}</span>
        </div>
        {/* Progress */}
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-[#AFCA05] rounded-full transition-all duration-300"
            style={{ width: `${((aktuelleFrageIdx + 1) / fragen.length) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-4">
        <div className="bg-white rounded-[24px] p-5">
          <p className="text-xs text-[#3BA9D3] font-semibold mb-2">
            {frage.typ === "single" ? "Eine Antwort korrekt" : "Mehrere Antworten möglich"}
          </p>
          <p className="text-[17px] font-bold text-[#111111] leading-snug">{frage.fragetext}</p>
        </div>

        <div className="flex flex-col gap-2">
          {[...frage.antwortoptionen].sort((a, b) => a.reihenfolge - b.reihenfolge).map((a) => {
            const gewaehlt = (auswahl[frage.id] ?? []).includes(a.id);
            return (
              <button key={a.id}
                onClick={() => toggleAntwort(frage.id, a.id, frage.typ === "multiple")}
                className="w-full p-4 rounded-[16px] border-2 text-left transition-all active:opacity-75"
                style={{
                  borderColor: gewaehlt ? "#1D3661" : "#E0E0E0",
                  background: gewaehlt ? "#EEF1F8" : "#FFFFFF",
                }}>
                <p className="text-sm font-medium text-[#111111]">{a.text}</p>
              </button>
            );
          })}
        </div>
      </main>

      <div className="p-5 flex gap-3">
        {aktuelleFrageIdx > 0 && (
          <button onClick={() => setAktuelleFrageIdx(i => i - 1)}
            className="flex-1 h-[52px] rounded-[16px] border border-[#E0E0E0] text-[#666666] font-semibold">
            Zurück
          </button>
        )}
        {!istLetzte ? (
          <button onClick={() => setAktuelleFrageIdx(i => i + 1)} disabled={!hatAuswahl}
            className="flex-1 h-[52px] rounded-[16px] bg-[#1D3661] text-white font-bold disabled:opacity-40">
            Weiter
          </button>
        ) : (
          <button onClick={handleAbschliessen} disabled={!hatAuswahl || submitting}
            className="flex-1 h-[52px] rounded-[16px] bg-[#AFCA05] text-[#111111] font-bold disabled:opacity-40">
            {submitting ? "Auswerten…" : "Quiz abschließen"}
          </button>
        )}
      </div>
    </div>
  );
}

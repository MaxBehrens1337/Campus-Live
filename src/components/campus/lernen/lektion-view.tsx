"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCampusSession } from "@/lib/stores/campus-session";
import { setLektionAbgeschlossen, getQuizFuerLektion } from "@/lib/lms/queries";
import type { Lektion, Quiz } from "@/types/lms";

export function LektionView({ slug, lektionId }: { slug: string; lektionId: string }) {
  const router = useRouter();
  const sb = createClient();
  const session = useCampusSession();
  const haendlerId = session.session?.registrationId;

  const [lektion, setLektion] = useState<Lektion | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [abgeschlossen, setAbgeschlossen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    async function laden() {
      const { data: l } = await sb.from("lektionen").select("*").eq("id", lektionId).single();
      setLektion(l);
      if (l) {
        const q = await getQuizFuerLektion(lektionId);
        setQuiz(q);
      }
      if (haendlerId) {
        const { data: f } = await sb.from("lernfortschritt").select("status")
          .eq("haendler_id", haendlerId).eq("lektion_id", lektionId).single();
        setAbgeschlossen(f?.status === "abgeschlossen");
      }
      setLoading(false);
    }
    laden();
  }, [lektionId]); // eslint-disable-line

  async function markierenAbgeschlossen() {
    if (!haendlerId) return;
    setMarking(true);
    await setLektionAbgeschlossen(haendlerId, lektionId);
    setAbgeschlossen(true);
    setMarking(false);
  }

  if (loading) return <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#3BA9D3] border-t-transparent rounded-full animate-spin" /></div>;
  if (!lektion) return <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center"><p className="text-sm text-[#666666]">Lektion nicht gefunden.</p></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/60 truncate">{slug.replace(/-/g, " ")}</p>
          <h1 className="text-base font-bold leading-tight truncate">{lektion.titel}</h1>
        </div>
        {abgeschlossen && <CheckCircle2 className="w-5 h-5 text-[#AFCA05] shrink-0" />}
      </header>

      <main className="flex-1 p-5 flex flex-col gap-4">
        {/* Lektion content */}
        <div className="bg-white rounded-[24px] p-6">
          <h2 className="text-[20px] font-bold text-[#1D3661] mb-3">{lektion.titel}</h2>
          {lektion.beschreibung
            ? <p className="text-sm text-[#666666] leading-relaxed">{lektion.beschreibung}</p>
            : <p className="text-sm text-[#999999] italic">Kein Inhalt vorhanden – Inhalt wird vom Trainer ergänzt.</p>}
        </div>

        {/* Quiz CTA */}
        {quiz && (
          <button
            onClick={() => router.push(`./lernen/${slug}/quiz/${quiz.id}`)}
            className="bg-[#1D3661] rounded-[20px] p-5 flex items-center gap-4 active:opacity-80 text-left">
            <div className="w-12 h-12 rounded-[14px] bg-white/10 flex items-center justify-center shrink-0">
              <PlayCircle className="w-7 h-7 text-[#AFCA05]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">Quiz starten</p>
              <p className="text-xs text-white/60 mt-0.5">Mindestens {quiz.mindestquote}% zum Bestehen</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-white/40 rotate-180 shrink-0" />
          </button>
        )}

        {/* Als abgeschlossen markieren */}
        {!abgeschlossen ? (
          <button onClick={markierenAbgeschlossen} disabled={marking}
            className="h-[56px] rounded-[16px] bg-[#AFCA05] text-[#111111] font-bold text-base disabled:opacity-40 active:opacity-80 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {marking ? "Wird gespeichert…" : "Als abgeschlossen markieren"}
          </button>
        ) : (
          <div className="h-[56px] rounded-[16px] bg-[#F5F9E0] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#AFCA05]" />
            <span className="font-bold text-[#AFCA05]">Abgeschlossen</span>
          </div>
        )}
      </main>
    </div>
  );
}

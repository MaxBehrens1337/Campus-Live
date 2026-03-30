"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2, CheckSquare, Circle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Lektion, Quiz, Frage, Antwortoption } from "@/types/lms";

type FrageForm = {
  fragetext: string;
  typ: "single" | "multiple";
  erklaerung: string;
  antworten: { text: string; ist_korrekt: boolean }[];
};

export function AdminLektionDetail({ lektionId }: { lektionId: string }) {
  const router = useRouter();
  const sb = createClient();
  const [lektion, setLektion] = useState<Lektion | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [fragen, setFragen] = useState<(Frage & { antwortoptionen: Antwortoption[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFrageForm, setShowFrageForm] = useState(false);
  const [frageForm, setFrageForm] = useState<FrageForm>({
    fragetext: "", typ: "single", erklaerung: "",
    antworten: [
      { text: "", ist_korrekt: false },
      { text: "", ist_korrekt: false },
      { text: "", ist_korrekt: false },
      { text: "", ist_korrekt: false },
    ],
  });
  const [saving, setSaving] = useState(false);

  async function laden() {
    setLoading(true);
    const { data: l } = await sb.from("lektionen").select("*").eq("id", lektionId).single();
    setLektion(l);

    let q = null;
    const { data: qData } = await sb.from("quizze").select("*").eq("lektion_id", lektionId).single();
    if (qData) {
      q = qData;
      const { data: fData } = await sb.from("fragen").select("*, antwortoptionen(*)").eq("quiz_id", qData.id).order("reihenfolge");
      setFragen((fData ?? []) as (Frage & { antwortoptionen: Antwortoption[] })[]);
    } else {
      setFragen([]);
    }
    setQuiz(q);
    setLoading(false);
  }

  useEffect(() => { laden(); }, []); // eslint-disable-line

  async function ensureQuiz(): Promise<string> {
    if (quiz?.id) return quiz.id;
    const { data } = await sb.from("quizze").insert({
      lektion_id: lektionId,
      titel: `Quiz: ${lektion?.titel ?? "Lektion"}`,
      modus: "am_ende",
      mindestquote: 70,
    }).select().single();
    setQuiz(data);
    return data!.id;
  }

  async function handleFrageSave() {
    const ausgefuellteAntworten = frageForm.antworten.filter(a => a.text.trim());
    if (!frageForm.fragetext.trim() || ausgefuellteAntworten.length < 2) return;

    setSaving(true);
    const quizId = await ensureQuiz();

    const { data: frage } = await sb.from("fragen").insert({
      quiz_id: quizId,
      typ: frageForm.typ,
      fragetext: frageForm.fragetext.trim(),
      erklaerung: frageForm.erklaerung.trim() || null,
      mehrere_korrekt: frageForm.typ === "multiple",
      reihenfolge: fragen.length + 1,
    }).select().single();

    if (frage) {
      await sb.from("antwortoptionen").insert(
        ausgefuellteAntworten.map((a, i) => ({
          frage_id: frage.id,
          text: a.text.trim(),
          ist_korrekt: a.ist_korrekt,
          reihenfolge: i,
        }))
      );
    }

    setFrageForm({ fragetext: "", typ: "single", erklaerung: "", antworten: [{text:"",ist_korrekt:false},{text:"",ist_korrekt:false},{text:"",ist_korrekt:false},{text:"",ist_korrekt:false}] });
    setShowFrageForm(false);
    setSaving(false);
    await laden();
  }

  async function deleteFrage(frageId: string) {
    await sb.from("fragen").delete().eq("id", frageId);
    await laden();
  }

  function toggleKorrekt(idx: number) {
    setFrageForm(f => {
      const antworten = [...f.antworten];
      if (f.typ === "single") {
        antworten.forEach((a, i) => { antworten[i] = { ...a, ist_korrekt: i === idx }; });
      } else {
        antworten[idx] = { ...antworten[idx], ist_korrekt: !antworten[idx].ist_korrekt };
      }
      return { ...f, antworten };
    });
  }

  if (loading) return <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#3BA9D3] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs text-white/60">Lektion</p>
            <h1 className="text-base font-bold leading-tight">{lektion?.titel ?? "…"}</h1>
          </div>
        </div>
        <button onClick={() => setShowFrageForm(true)} className="flex items-center gap-1.5 bg-[#AFCA05] text-[#111111] rounded-[999px] px-4 py-2 text-sm font-bold">
          <Plus className="w-4 h-4" /> Frage
        </button>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-4">
        {/* Quiz info */}
        {quiz && (
          <div className="bg-[#1D3661] rounded-[20px] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Quiz</p>
              <p className="text-sm font-bold text-white">{fragen.length} Fragen · Min. {quiz.mindestquote}% zum Bestehen</p>
            </div>
            <CheckSquare className="w-6 h-6 text-[#AFCA05]" />
          </div>
        )}

        {fragen.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-semibold text-[#666666]">Noch keine Fragen</p>
            <p className="text-xs text-[#999999] mt-1">Tippen Sie auf „Frage" um die erste Frage hinzuzufügen.</p>
          </div>
        ) : fragen.map((frage, i) => (
          <div key={frage.id} className="bg-white rounded-[20px] p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-[6px] bg-[#1D3661] text-white text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                <span className="text-xs font-medium text-[#3BA9D3]">{frage.typ === "single" ? "Single Choice" : "Multiple Choice"}</span>
              </div>
              <button onClick={() => deleteFrage(frage.id)} className="w-8 h-8 rounded-[10px] bg-[#FEF0F2] flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-[#CE132D]" />
              </button>
            </div>
            <p className="text-sm font-semibold text-[#111111] mb-3">{frage.fragetext}</p>
            <div className="flex flex-col gap-2">
              {frage.antwortoptionen.sort((a, b) => a.reihenfolge - b.reihenfolge).map((a) => (
                <div key={a.id} className={`flex items-center gap-2 p-2.5 rounded-[12px] ${a.ist_korrekt ? "bg-[#F5F9E0]" : "bg-[#F0F0F0]"}`}>
                  {a.ist_korrekt
                    ? <CheckCircle className="w-4 h-4 text-[#AFCA05] shrink-0" />
                    : <Circle className="w-4 h-4 text-[#CCCCCC] shrink-0" />}
                  <p className="text-sm text-[#111111]">{a.text}</p>
                </div>
              ))}
            </div>
            {frage.erklaerung && <p className="mt-3 text-xs text-[#666666] italic">💡 {frage.erklaerung}</p>}
          </div>
        ))}
      </main>

      {/* New Frage Modal */}
      {showFrageForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="bg-white rounded-t-[32px] w-full max-h-[92vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-[#1D3661] mb-5">Neue Frage</h2>
              <div className="flex flex-col gap-4">
                {/* Typ */}
                <div className="grid grid-cols-2 gap-2">
                  {(["single", "multiple"] as const).map(t => (
                    <button key={t} onClick={() => setFrageForm(f => ({...f, typ: t}))}
                      className="h-[44px] rounded-[14px] border-2 text-sm font-semibold transition-colors"
                      style={{ borderColor: frageForm.typ === t ? "#1D3661" : "#E0E0E0", background: frageForm.typ === t ? "#1D3661" : "#FFF", color: frageForm.typ === t ? "#FFF" : "#111" }}>
                      {t === "single" ? "Single Choice" : "Multiple Choice"}
                    </button>
                  ))}
                </div>

                {/* Fragetext */}
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-1.5">Frage *</label>
                  <textarea value={frageForm.fragetext} onChange={e => setFrageForm(f => ({...f, fragetext: e.target.value}))}
                    rows={3} placeholder="Wie funktioniert…?"
                    className="w-full px-4 py-3 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white resize-none" />
                </div>

                {/* Antworten */}
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">
                    Antwortoptionen <span className="text-[#999999] font-normal">(Haken = korrekt)</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {frageForm.antworten.map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button onClick={() => toggleKorrekt(i)}
                          className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${a.ist_korrekt ? "bg-[#AFCA05]" : "bg-[#F0F0F0]"}`}>
                          <CheckCircle className={`w-4 h-4 ${a.ist_korrekt ? "text-white" : "text-[#CCCCCC]"}`} />
                        </button>
                        <input value={a.text} onChange={e => { const arr = [...frageForm.antworten]; arr[i] = {...arr[i], text: e.target.value}; setFrageForm(f => ({...f, antworten: arr})); }}
                          placeholder={`Antwort ${i + 1}`}
                          className="flex-1 h-[44px] px-3 rounded-[12px] border border-[#E0E0E0] bg-[#F0F0F0] text-sm outline-none focus:border-[#3BA9D3] focus:bg-white" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Erklärung */}
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-1.5">Erklärung (optional)</label>
                  <input value={frageForm.erklaerung} onChange={e => setFrageForm(f => ({...f, erklaerung: e.target.value}))}
                    placeholder="Wird nach Beantwortung angezeigt…"
                    className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowFrageForm(false)} className="flex-1 h-[52px] rounded-[16px] border border-[#E0E0E0] text-[#666666] font-semibold">Abbrechen</button>
                  <button onClick={handleFrageSave} disabled={saving || !frageForm.fragetext.trim()}
                    className="flex-1 h-[52px] rounded-[16px] bg-[#1D3661] text-white font-semibold disabled:opacity-40">
                    {saving ? "Speichern…" : "Frage speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

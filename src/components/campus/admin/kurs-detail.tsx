"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Pencil, GripVertical, HelpCircle, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Kurs, Lektion } from "@/types/lms";

export function AdminKursDetail({ kursId }: { kursId: string }) {
  const router = useRouter();
  const sb = createClient();
  const [kurs, setKurs] = useState<Kurs | null>(null);
  const [lektionen, setLektionen] = useState<Lektion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titel: "", beschreibung: "", dauer_min: "" });
  const [saving, setSaving] = useState(false);

  async function laden() {
    setLoading(true);
    const [{ data: k }, { data: l }] = await Promise.all([
      sb.from("kurse").select("*").eq("id", kursId).single(),
      sb.from("lektionen").select("*").eq("kurs_id", kursId).order("reihenfolge"),
    ]);
    setKurs(k);
    setLektionen(l ?? []);
    setLoading(false);
  }

  useEffect(() => { laden(); }, []); // eslint-disable-line

  async function handleSave() {
    if (!form.titel.trim()) return;
    setSaving(true);
    await sb.from("lektionen").insert({
      kurs_id: kursId,
      titel: form.titel.trim(),
      beschreibung: form.beschreibung.trim() || null,
      dauer_min: form.dauer_min ? Number(form.dauer_min) : null,
      reihenfolge: lektionen.length + 1,
    });
    setForm({ titel: "", beschreibung: "", dauer_min: "" });
    setShowForm(false);
    setSaving(false);
    await laden();
  }

  async function toggleStatus(l: Lektion) {
    const next = l.status === "veroeffentlicht" ? "entwurf" : "veroeffentlicht";
    await sb.from("lektionen").update({ status: next }).eq("id", l.id);
    await laden();
  }

  if (loading) return <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F0F0F0]"><div className="w-8 h-8 border-2 border-[#3BA9D3] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs text-white/60">Kurs</p>
            <h1 className="text-base font-bold leading-tight">{kurs?.titel ?? "…"}</h1>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#AFCA05] text-[#111111] rounded-[999px] px-4 py-2 text-sm font-bold">
          <Plus className="w-4 h-4" /> Lektion
        </button>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-3">
        {lektionen.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-[20px] bg-white flex items-center justify-center mb-3">
              <HelpCircle className="w-7 h-7 text-[#CCCCCC]" />
            </div>
            <p className="text-sm font-semibold text-[#666666]">Noch keine Lektionen</p>
            <p className="text-xs text-[#999999] mt-1">Tippen Sie auf „Lektion" um die erste Lektion anzulegen.</p>
          </div>
        ) : lektionen.map((l, i) => (
          <div key={l.id} className="bg-white rounded-[20px] p-4 flex items-center gap-3">
            <GripVertical className="w-5 h-5 text-[#CCCCCC] shrink-0" />
            <div className="w-7 h-7 rounded-[8px] bg-[#F0F0F0] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[#1D3661]">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111111] truncate">{l.titel}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-medium ${l.status === "veroeffentlicht" ? "text-[#AFCA05]" : "text-[#999999]"}`}>
                  {l.status === "veroeffentlicht" ? "Veröffentlicht" : "Entwurf"}
                </span>
                {l.dauer_min && <span className="flex items-center gap-1 text-xs text-[#CCCCCC]"><Clock className="w-3 h-3" />{l.dauer_min} Min.</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => toggleStatus(l)} className="w-8 h-8 rounded-[10px] bg-[#F0F0F0] flex items-center justify-center">
                <CheckCircle2 className={`w-4 h-4 ${l.status === "veroeffentlicht" ? "text-[#AFCA05]" : "text-[#CCCCCC]"}`} />
              </button>
              <button onClick={() => router.push(`../lektionen/${l.id}`)} className="w-8 h-8 rounded-[10px] bg-[#1D3661] flex items-center justify-center">
                <Pencil className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* New Lektion Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="bg-white rounded-t-[32px] w-full p-6">
            <h2 className="text-lg font-bold text-[#1D3661] mb-5">Neue Lektion</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-1.5">Titel *</label>
                <input value={form.titel} onChange={e => setForm(f => ({...f, titel: e.target.value}))}
                  placeholder="z. B. Einführung in den CAN-Bus"
                  className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-1.5">Beschreibung</label>
                <textarea value={form.beschreibung} onChange={e => setForm(f => ({...f, beschreibung: e.target.value}))}
                  rows={2} placeholder="Kurze Beschreibung…"
                  className="w-full px-4 py-3 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-1.5">Dauer (Min.)</label>
                <input type="number" value={form.dauer_min} onChange={e => setForm(f => ({...f, dauer_min: e.target.value}))}
                  className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 h-[52px] rounded-[16px] border border-[#E0E0E0] text-[#666666] font-semibold">Abbrechen</button>
                <button onClick={handleSave} disabled={saving || !form.titel.trim()}
                  className="flex-1 h-[52px] rounded-[16px] bg-[#1D3661] text-white font-semibold disabled:opacity-40">
                  {saving ? "Speichern…" : "Anlegen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

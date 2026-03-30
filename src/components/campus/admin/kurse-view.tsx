"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Pencil, BookOpen, CheckCircle2, Clock, Archive } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Kurs, KursStatus } from "@/types/lms";

const STATUS_CONFIG: Record<KursStatus, { label: string; color: string; bg: string }> = {
  entwurf:        { label: "Entwurf",        color: "#999999", bg: "#F0F0F0" },
  veroeffentlicht:{ label: "Veröffentlicht", color: "#AFCA05", bg: "#F5F9E0" },
  archiviert:     { label: "Archiviert",     color: "#CE132D", bg: "#FEF0F2" },
};

export function AdminKurseView() {
  const router = useRouter();
  const sb = createClient();
  const [kurse, setKurse] = useState<Kurs[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titel: "", beschreibung: "", dauer_min: "" });
  const [saving, setSaving] = useState(false);

  async function laden() {
    setLoading(true);
    const { data } = await sb.from("kurse").select("*").order("reihenfolge");
    setKurse(data ?? []);
    setLoading(false);
  }

  useEffect(() => { laden(); }, []); // eslint-disable-line

  async function handleSave() {
    if (!form.titel.trim()) return;
    setSaving(true);
    const slug = form.titel.toLowerCase()
      .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] ?? c))
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await sb.from("kurse").insert({
      titel: form.titel.trim(),
      slug: `${slug}-${Date.now()}`,
      beschreibung: form.beschreibung.trim() || null,
      dauer_min: form.dauer_min ? Number(form.dauer_min) : null,
      reihenfolge: kurse.length + 1,
    });
    setForm({ titel: "", beschreibung: "", dauer_min: "" });
    setShowForm(false);
    setSaving(false);
    await laden();
  }

  async function toggleStatus(kurs: Kurs) {
    const next: KursStatus = kurs.status === "veroeffentlicht" ? "entwurf" : "veroeffentlicht";
    await sb.from("kurse").update({ status: next }).eq("id", kurs.id);
    await laden();
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs text-white/60">Admin</p>
            <h1 className="text-base font-bold">Kursverwaltung</h1>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#AFCA05] text-[#111111] rounded-[999px] px-4 py-2 text-sm font-bold">
          <Plus className="w-4 h-4" /> Neuer Kurs
        </button>
      </header>

      {/* Stats */}
      <div className="px-5 pt-5 grid grid-cols-3 gap-3">
        {(["entwurf", "veroeffentlicht", "archiviert"] as KursStatus[]).map((s) => {
          const count = kurse.filter((k) => k.status === s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className="bg-white rounded-[16px] p-3 text-center">
              <p className="text-[22px] font-bold" style={{ color: cfg.color }}>{count}</p>
              <p className="text-[10px] text-[#999999] mt-0.5">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      <main className="flex-1 p-5 flex flex-col gap-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="bg-white rounded-[24px] h-24 animate-pulse" />)
        ) : kurse.map((kurs) => {
          const cfg = STATUS_CONFIG[kurs.status];
          return (
            <div key={kurs.id} className="bg-white rounded-[24px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-[12px] bg-[#F0F0F0] flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-[#1D3661]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#111111] text-sm leading-snug">{kurs.titel}</p>
                    {kurs.beschreibung && <p className="text-xs text-[#666666] mt-0.5 line-clamp-2">{kurs.beschreibung}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-[999px]"
                        style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.label}
                      </span>
                      {kurs.dauer_min && (
                        <span className="flex items-center gap-1 text-xs text-[#999999]">
                          <Clock className="w-3 h-3" />{kurs.dauer_min} Min.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleStatus(kurs)}
                    className="w-9 h-9 rounded-[12px] bg-[#F0F0F0] flex items-center justify-center active:opacity-70"
                    title={kurs.status === "veroeffentlicht" ? "Zurück zu Entwurf" : "Veröffentlichen"}>
                    {kurs.status === "veroeffentlicht"
                      ? <Archive className="w-4 h-4 text-[#999999]" />
                      : <CheckCircle2 className="w-4 h-4 text-[#AFCA05]" />}
                  </button>
                  <button onClick={() => router.push(`./kurse/${kurs.id}`)}
                    className="w-9 h-9 rounded-[12px] bg-[#1D3661] flex items-center justify-center active:opacity-80">
                    <Pencil className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* New Course Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="bg-white rounded-t-[32px] w-full p-6">
            <h2 className="text-lg font-bold text-[#1D3661] mb-5">Neuer Kurs</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-1.5">Titel *</label>
                <input value={form.titel} onChange={e => setForm(f => ({...f, titel: e.target.value}))}
                  placeholder="z. B. CAN-Bus Grundlagen"
                  className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-1.5">Beschreibung</label>
                <textarea value={form.beschreibung} onChange={e => setForm(f => ({...f, beschreibung: e.target.value}))}
                  rows={3} placeholder="Kurze Beschreibung…"
                  className="w-full px-4 py-3 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-1.5">Geschätzte Dauer (Min.)</label>
                <input type="number" value={form.dauer_min} onChange={e => setForm(f => ({...f, dauer_min: e.target.value}))}
                  placeholder="—"
                  className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 h-[52px] rounded-[16px] border border-[#E0E0E0] text-[#666666] font-semibold">Abbrechen</button>
                <button onClick={handleSave} disabled={saving || !form.titel.trim()}
                  className="flex-1 h-[52px] rounded-[16px] bg-[#1D3661] text-white font-semibold disabled:opacity-40">
                  {saving ? "Speichern…" : "Kurs anlegen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

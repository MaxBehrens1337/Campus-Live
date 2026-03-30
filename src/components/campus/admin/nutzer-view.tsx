"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, UserCircle, X, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Haendler, Rolle } from "@/types/lms";

const ROLLEN: { value: Rolle; label: string }[] = [
  { value: "lernender", label: "Lernender" },
  { value: "trainer",   label: "Trainer" },
  { value: "admin",     label: "Admin" },
];

export function AdminNutzerView() {
  const router = useRouter();
  const sb = createClient();
  const [nutzer, setNutzer] = useState<Haendler[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ kundennummer: "", firmenname: "", email: "", passwort: "", rolle: "lernender" as Rolle });
  const [saving, setSaving] = useState(false);

  async function laden() {
    setLoading(true);
    const { data } = await sb.from("haendler").select("id,kundennummer,firmenname,vorname,nachname,email,rolle,aktiv,erstellt_am").order("erstellt_am", { ascending: false });
    setNutzer((data ?? []) as Haendler[]);
    setLoading(false);
  }
  useEffect(() => { laden(); }, []); // eslint-disable-line

  async function handleSave() {
    if (!form.kundennummer.trim() || !form.passwort.trim()) return;
    setSaving(true);
    // Use RPC to create with hashed password
    await sb.rpc("create_haendler_with_password", {
      p_kundennummer: form.kundennummer.trim(),
      p_firmenname: form.firmenname.trim() || null,
      p_email: form.email.trim() || null,
      p_passwort: form.passwort,
      p_rolle: form.rolle,
    });
    setForm({ kundennummer: "", firmenname: "", email: "", passwort: "", rolle: "lernender" });
    setShowForm(false);
    setSaving(false);
    await laden();
  }

  async function toggleAktiv(n: Haendler) {
    await sb.from("haendler").update({ aktiv: !n.aktiv }).eq("id", n.id);
    await laden();
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <p className="text-xs text-white/60">Admin</p>
            <h1 className="text-base font-bold">Nutzerverwaltung</h1>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#AFCA05] text-[#111111] rounded-[999px] px-4 py-2 text-sm font-bold">
          <Plus className="w-4 h-4" /> Nutzer
        </button>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3 mb-1">
          {ROLLEN.map(r => {
            const count = nutzer.filter(n => n.rolle === r.value).length;
            return (
              <div key={r.value} className="bg-white rounded-[16px] p-3 text-center">
                <p className="text-[20px] font-bold text-[#1D3661]">{count}</p>
                <p className="text-[10px] text-[#999999] mt-0.5">{r.label}</p>
              </div>
            );
          })}
        </div>

        {loading ? [1,2,3].map(i => <div key={i} className="bg-white rounded-[20px] h-16 animate-pulse" />) :
          nutzer.map(n => (
            <div key={n.id} className={`bg-white rounded-[20px] p-4 flex items-center gap-3 ${!n.aktiv ? "opacity-50" : ""}`}>
              <div className="w-10 h-10 rounded-[12px] bg-[#F0F0F0] flex items-center justify-center shrink-0">
                <UserCircle className="w-6 h-6 text-[#1D3661]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111111] truncate">{n.firmenname ?? n.kundennummer}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#3BA9D3]">#{n.kundennummer}</span>
                  <span className="text-xs text-[#999999]">{ROLLEN.find(r => r.value === n.rolle)?.label ?? n.rolle}</span>
                </div>
              </div>
              <button onClick={() => toggleAktiv(n)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-[999px] ${n.aktiv ? "bg-[#F0F0F0] text-[#666666]" : "bg-[#FEF0F2] text-[#CE132D]"}`}>
                {n.aktiv ? "Aktiv" : "Gesperrt"}
              </button>
            </div>
          ))
        }
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="bg-white rounded-t-[32px] w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1D3661]">Neuer Nutzer</h2>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-[12px] bg-[#F0F0F0] flex items-center justify-center">
                <X className="w-5 h-5 text-[#666666]" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { key: "kundennummer", label: "Kundennummer *", placeholder: "z. B. 10042" },
                { key: "firmenname",   label: "Name / Firma",   placeholder: "Max Mustermann GmbH" },
                { key: "email",        label: "E-Mail",         placeholder: "max@beispiel.de" },
                { key: "passwort",     label: "Passwort *",     placeholder: "Sicheres Passwort" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-[#111111] mb-1.5">{f.label}</label>
                  <input
                    type={f.key === "passwort" ? "password" : "text"}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-1.5">Rolle</label>
                <div className="relative">
                  <select value={form.rolle} onChange={e => setForm(f => ({...f, rolle: e.target.value as Rolle}))}
                    className="w-full h-[52px] pl-4 pr-10 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none appearance-none">
                    {ROLLEN.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 h-[52px] rounded-[16px] border border-[#E0E0E0] text-[#666666] font-semibold">Abbrechen</button>
                <button onClick={handleSave} disabled={saving || !form.kundennummer.trim() || !form.passwort.trim()}
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

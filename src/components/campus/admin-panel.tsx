"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, BookOpen, HelpCircle, AlertTriangle, ImageOff,
  ChevronRight, Shield, Edit3, Users, BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Kurs, Profil } from "@/types/lms";
import { QuellStatusBadge } from "./media-placeholder";

export function AdminPanel() {
  const router = useRouter();
  const sb = createClient();

  const [profil, setProfil] = useState<Profil | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [kurse, setKurse] = useState<Kurs[]>([]);
  const [stats, setStats] = useState({ fragenGesamt: 0, unvollstaendig: 0, medienFehlen: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function laden() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setAuthChecked(true); setLoading(false); return; }

      const { data: p } = await sb.from("profiles").select("*").eq("id", user.id).single();
      setProfil(p);
      setAuthChecked(true);

      if (!p || (p.rolle !== "admin" && p.rolle !== "editor")) {
        setLoading(false);
        return;
      }

      // Load all kurse (including drafts)
      const { data: k } = await sb.from("kurse").select("*").order("reihenfolge");
      setKurse(k ?? []);

      // Load question stats
      const { data: fragen } = await sb.from("fragen").select("id, inhalt_status");
      const alleFragen = fragen ?? [];
      setStats({
        fragenGesamt: alleFragen.length,
        unvollstaendig: alleFragen.filter(f => f.inhalt_status === "unvollstaendig").length,
        medienFehlen: alleFragen.filter(f => f.inhalt_status === "medien_fehlen").length,
      });

      setLoading(false);
    }
    laden();
  }, []); // eslint-disable-line

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3BA9D3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profil || (profil.rolle !== "admin" && profil.rolle !== "editor")) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
        <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Admin-Bereich</h1>
        </header>
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Shield className="w-12 h-12 text-[#CE132D] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#111111]">Kein Zugriff</p>
            <p className="text-xs text-[#666666] mt-1">Sie benötigen Admin- oder Editor-Rechte.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      {/* Header */}
      <header className="bg-[#1D3661] text-white px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex-1">Admin-Bereich</h1>
          <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-[6px]">{profil.rolle}</span>
        </div>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Module" value={kurse.length} icon={BookOpen} color="#1D3661" />
          <StatCard label="Fragen" value={stats.fragenGesamt} icon={HelpCircle} color="#3BA9D3" />
          <StatCard label="Unvoll­ständig" value={stats.unvollstaendig} icon={AlertTriangle} color="#CE132D" />
          <StatCard label="Medien fehlen" value={stats.medienFehlen} icon={ImageOff} color="#B45309" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <ActionButton label="Kursverwaltung" sublabel="Module bearbeiten" icon={Edit3} onClick={() => router.push("./admin/kurse")} />
          <ActionButton label="Nutzerverwaltung" sublabel="Rollen & Profile" icon={Users} onClick={() => router.push("./admin/nutzer")} />
          <ActionButton label="Fragenverwaltung" sublabel="Quiz bearbeiten" icon={HelpCircle} onClick={() => router.push("./admin/fragen")} />
          <ActionButton label="Redaktion" sublabel="Offene Punkte" icon={AlertTriangle} onClick={() => {/* TODO */}} />
        </div>

        {/* Module list with status */}
        <div>
          <h2 className="text-base font-bold text-[#1D3661] mb-3">Modulübersicht</h2>
          <div className="flex flex-col gap-2">
            {kurse.map((kurs) => (
              <button
                key={kurs.id}
                onClick={() => router.push(`./admin/kurse/${kurs.id}`)}
                className="bg-white rounded-[16px] p-4 flex items-center gap-3 text-left active:opacity-75 transition-opacity"
              >
                <div className="w-10 h-10 rounded-[12px] bg-[#1D3661]/5 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[#1D3661]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#111111] truncate">{kurs.titel}</p>
                    <QuellStatusBadge status={kurs.quell_status} />
                    <StatusPill status={kurs.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[#666666]">
                    <span>{kurs.fragen_anzahl} Fragen</span>
                    {kurs.hat_video && <span>🎬 Video</span>}
                    {kurs.hat_bilder && <span>🖼️ Bilder</span>}
                    <span className="text-[#999999]">{kurs.quell_datei}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#CCCCCC] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-white rounded-[16px] p-3 text-center">
      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: `${color}10` }}>
        <span style={{ color }}><Icon className="w-4 h-4" /></span>
      </div>
      <p className="text-[18px] font-bold" style={{ color }}>{value}</p>
      <p className="text-[9px] text-[#999999] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function ActionButton({ label, sublabel, icon: Icon, onClick }: { label: string; sublabel: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white rounded-[16px] p-4 text-left flex items-center gap-3 active:opacity-75 transition-opacity">
      <div className="w-10 h-10 rounded-[12px] bg-[#1D3661]/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#1D3661]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#111111]">{label}</p>
        <p className="text-xs text-[#666666]">{sublabel}</p>
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    veroeffentlicht: { label: "Live", bg: "bg-[#AFCA05]/15", fg: "text-[#6B7F00]" },
    entwurf: { label: "Entwurf", bg: "bg-[#E0E0E0]", fg: "text-[#666666]" },
    archiviert: { label: "Archiv", bg: "bg-[#F0F0F0]", fg: "text-[#999999]" },
  };
  const s = map[status] ?? map.entwurf;
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] ${s.bg} ${s.fg}`}>{s.label}</span>;
}

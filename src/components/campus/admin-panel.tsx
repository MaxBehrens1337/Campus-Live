"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Trash2, Upload, X, FileType, Play, Link2, FileText, ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Inhalt, InhaltNeu, DateiTyp } from "@/types/inhalte";
import { BEREICHE } from "@/types/inhalte";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1234";

const TYP_OPTIONS: { value: DateiTyp; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "pdf",   label: "PDF-Dokument",  icon: FileType },
  { value: "video", label: "Video",         icon: Play },
  { value: "link",  label: "Externer Link", icon: Link2 },
  { value: "text",  label: "Artikel/Text",  icon: FileText },
];

export function AdminPanel() {
  const router = useRouter();
  const supabase = createClient();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [inhalte, setInhalte] = useState<Inhalt[]>([]);
  const [filterBereich, setFilterBereich] = useState<string>("alle");
  const [loading, setLoading] = useState(true);

  // ── Upload form ───────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InhaltNeu>({
    bereich: BEREICHE[0].id,
    titel: "",
    beschreibung: "",
    datei_typ: "pdf",
    video_url: "",
    reihenfolge: 10,
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptedMime =
    form.datei_typ === "pdf"
      ? "application/pdf"
      : form.datei_typ === "video"
      ? "video/mp4,video/webm,video/quicktime"
      : "";

  // ── Load inhalte ─────────────────────────────────────────────────────────
  async function loadInhalte() {
    setLoading(true);
    const { data } = await supabase
      .from("inhalte")
      .select("*")
      .order("bereich")
      .order("reihenfolge");
    setInhalte(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (authenticated) loadInhalte();
  }, [authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PIN check ────────────────────────────────────────────────────────────
  function checkPin() {
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function deleteInhalt(inhalt: Inhalt) {
    if (!confirm(`"${inhalt.titel}" wirklich löschen?`)) return;

    // Delete file from storage if it's a Supabase URL
    if (inhalt.datei_url?.includes("supabase")) {
      const path = inhalt.datei_url.split("/campus-inhalte/")[1];
      if (path) await supabase.storage.from("campus-inhalte").remove([path]);
    }

    await supabase.from("inhalte").delete().eq("id", inhalt.id);
    await loadInhalte();
  }

  // ── Upload & Save ────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.titel.trim()) return;
    setUploading(true);
    setUploadProgress(0);

    let dateiUrl = form.video_url ?? "";

    // Upload file to Supabase Storage
    if (file && (form.datei_typ === "pdf" || form.datei_typ === "video")) {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${form.bereich}/${fileName}`;

      setUploadProgress(30);
      const { data, error } = await supabase.storage
        .from("campus-inhalte")
        .upload(path, file, { upsert: false });

      if (error) {
        alert("Upload fehlgeschlagen: " + error.message);
        setUploading(false);
        return;
      }

      setUploadProgress(80);
      const { data: urlData } = supabase.storage
        .from("campus-inhalte")
        .getPublicUrl(data.path);
      dateiUrl = urlData.publicUrl;
    }

    setUploadProgress(90);

    const neuerInhalt: InhaltNeu = {
      bereich:     form.bereich,
      titel:       form.titel.trim(),
      beschreibung: form.beschreibung?.trim() || undefined,
      datei_typ:   form.datei_typ,
      datei_url:   dateiUrl || undefined,
      video_url:   form.datei_typ === "video" ? (form.video_url?.trim() || dateiUrl) : undefined,
      reihenfolge: form.reihenfolge ?? 10,
      dauer_min:   form.dauer_min,
    };

    await supabase.from("inhalte").insert(neuerInhalt);
    setUploadProgress(100);

    // Reset
    setForm({
      bereich: BEREICHE[0].id,
      titel: "",
      beschreibung: "",
      datei_typ: "pdf",
      video_url: "",
      reihenfolge: 10,
    });
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
    setShowForm(false);
    await loadInhalte();
  }

  // ── PIN screen ────────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
        <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center active:opacity-70"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Admin-Bereich</h1>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-xs">
            <h2 className="text-[20px] font-bold text-[#1D3661] mb-1">Zugangscode</h2>
            <p className="text-sm text-[#666666] mb-6">
              Bitte geben Sie den Admin-PIN ein.
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              onKeyDown={(e) => e.key === "Enter" && checkPin()}
              placeholder="PIN"
              className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white transition-colors text-center tracking-widest"
            />
            {pinError && (
              <p className="mt-2 text-sm text-[#CE132D] text-center">
                Falscher PIN
              </p>
            )}
            <button
              onClick={checkPin}
              className="mt-4 w-full h-[52px] rounded-[16px] bg-[#1D3661] text-white font-semibold text-base active:opacity-80"
            >
              Bestätigen
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Main admin panel ──────────────────────────────────────────────────────
  const sichtbareInhalte =
    filterBereich === "alle"
      ? inhalte
      : inhalte.filter((i) => i.bereich === filterBereich);

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      {/* LMS-Schnellzugriff Banner */}
      <div className="bg-[#1D3661] px-5 pt-4 pb-0">
        <div className="grid grid-cols-2 gap-2 pb-4">
          {[
            { label: "Kursverwaltung", path: "./kurse" },
            { label: "Nutzerverwaltung", path: "./nutzer" },
          ].map(item => (
            <button key={item.path} onClick={() => router.push(item.path)}
              className="h-[44px] rounded-[12px] bg-white/10 text-white text-sm font-semibold active:opacity-70">
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center active:opacity-70"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Inhalte verwalten</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-[#AFCA05] text-[#111111] rounded-[999px] px-4 py-2 text-sm font-bold active:opacity-80"
        >
          <Plus className="w-4 h-4" />
          Neu
        </button>
      </header>

      {/* Upload Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="bg-white rounded-t-[32px] w-full max-h-[92vh] overflow-y-auto">
            <div className="p-5 pb-safe">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#1D3661]">
                  Neuer Inhalt
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-9 h-9 rounded-[12px] bg-[#F0F0F0] flex items-center justify-center active:opacity-70"
                >
                  <X className="w-5 h-5 text-[#666666]" />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {/* Bereich */}
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">
                    Bereich
                  </label>
                  <div className="relative">
                    <select
                      value={form.bereich}
                      onChange={(e) => setForm((f) => ({ ...f, bereich: e.target.value }))}
                      className="w-full h-[52px] pl-4 pr-10 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base text-[#111111] outline-none appearance-none focus:border-[#3BA9D3] focus:bg-white"
                    >
                      {BEREICHE.map((b) => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                  </div>
                </div>

                {/* Typ */}
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">
                    Typ
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYP_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = form.datei_typ === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, datei_typ: opt.value }));
                            setFile(null);
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                          className="h-[52px] rounded-[16px] border-2 flex items-center gap-2 px-4 text-sm font-semibold transition-colors"
                          style={{
                            borderColor: active ? "#1D3661" : "#E0E0E0",
                            background: active ? "#1D3661" : "#FFFFFF",
                            color: active ? "#FFFFFF" : "#111111",
                          }}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Titel */}
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={form.titel}
                    onChange={(e) => setForm((f) => ({ ...f, titel: e.target.value }))}
                    placeholder="z. B. Einbauanleitung HIQ Serie"
                    className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white transition-colors"
                  />
                </div>

                {/* Beschreibung */}
                <div>
                  <label className="block text-sm font-semibold text-[#111111] mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={form.beschreibung}
                    onChange={(e) => setForm((f) => ({ ...f, beschreibung: e.target.value }))}
                    placeholder="Kurze Beschreibung des Inhalts …"
                    rows={3}
                    className="w-full px-4 py-3 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white transition-colors resize-none"
                  />
                </div>

                {/* File Upload (PDF / Video) */}
                {(form.datei_typ === "pdf" || form.datei_typ === "video") && (
                  <div>
                    <label className="block text-sm font-semibold text-[#111111] mb-2">
                      {form.datei_typ === "pdf" ? "PDF-Datei" : "Video-Datei"}
                    </label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={acceptedMime}
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-[100px] rounded-[16px] border-2 border-dashed border-[#E0E0E0] bg-[#F8F8F8] cursor-pointer active:opacity-70 transition-colors hover:border-[#3BA9D3]"
                    >
                      {file ? (
                        <div className="text-center px-4">
                          <p className="text-sm font-semibold text-[#1D3661] truncate max-w-[240px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-[#999999] mt-1">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-[#CCCCCC] mb-2" />
                          <p className="text-sm text-[#999999]">
                            Tippen zum Auswählen
                          </p>
                          <p className="text-xs text-[#CCCCCC]">
                            {form.datei_typ === "pdf" ? "PDF" : "MP4, WebM"} · max. 50 MB
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                )}

                {/* Video URL (for video type as alternative or for link type) */}
                {(form.datei_typ === "video" || form.datei_typ === "link") && (
                  <div>
                    <label className="block text-sm font-semibold text-[#111111] mb-2">
                      {form.datei_typ === "video"
                        ? "Oder: Video-URL (YouTube/Vimeo)"
                        : "URL"}
                    </label>
                    <input
                      type="url"
                      value={form.video_url}
                      onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                      placeholder={
                        form.datei_typ === "video"
                          ? "https://youtube.com/watch?v=…"
                          : "https://…"
                      }
                      className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white transition-colors"
                    />
                  </div>
                )}

                {/* Dauer + Reihenfolge */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#111111] mb-2">
                      Dauer (Min.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.dauer_min ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, dauer_min: Number(e.target.value) || undefined }))}
                      placeholder="—"
                      className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#111111] mb-2">
                      Reihenfolge
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.reihenfolge ?? 10}
                      onChange={(e) => setForm((f) => ({ ...f, reihenfolge: Number(e.target.value) }))}
                      className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-base outline-none focus:border-[#3BA9D3] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Upload progress */}
                {uploading && (
                  <div>
                    <div className="h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#AFCA05] rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#666666] mt-1 text-center">
                      Hochladen … {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSave}
                  disabled={uploading || !form.titel.trim()}
                  className="h-[56px] rounded-[16px] bg-[#1D3661] text-white font-semibold text-base disabled:opacity-40 active:opacity-80 flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  {uploading ? "Wird gespeichert …" : "Inhalt speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content List */}
      <main className="flex-1 p-5 flex flex-col gap-4">
        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <FilterChip
            label="Alle"
            active={filterBereich === "alle"}
            onClick={() => setFilterBereich("alle")}
          />
          {BEREICHE.map((b) => (
            <FilterChip
              key={b.id}
              label={b.label}
              active={filterBereich === b.id}
              onClick={() => setFilterBereich(b.id)}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {BEREICHE.map((b) => {
            const count = inhalte.filter((i) => i.bereich === b.id).length;
            return (
              <div key={b.id} className="bg-white rounded-[16px] p-3 text-center">
                <p className="text-[22px] font-bold text-[#1D3661]">{count}</p>
                <p className="text-[10px] text-[#999999] mt-0.5 leading-tight">
                  {b.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Items */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[24px] h-20 animate-pulse" />
            ))}
          </div>
        ) : sichtbareInhalte.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <p className="text-sm text-[#999999]">Noch keine Inhalte – tippen Sie auf „Neu".</p>
          </div>
        ) : (
          sichtbareInhalte.map((inhalt) => (
            <AdminInhaltRow
              key={inhalt.id}
              inhalt={inhalt}
              onDelete={() => deleteInhalt(inhalt)}
            />
          ))
        )}
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 h-[36px] px-4 rounded-[999px] text-sm font-semibold transition-colors"
      style={{
        background: active ? "#1D3661" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#666666",
      }}
    >
      {label}
    </button>
  );
}

function AdminInhaltRow({ inhalt, onDelete }: { inhalt: Inhalt; onDelete: () => void }) {
  const TYP_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    pdf: FileType, video: Play, link: Link2, text: FileText,
  };
  const Icon = TYP_ICON_MAP[inhalt.datei_typ ?? "text"] ?? FileText;
  const bereichLabel = BEREICHE.find((b) => b.id === inhalt.bereich)?.label ?? inhalt.bereich;

  return (
    <div className="bg-white rounded-[20px] p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-[12px] bg-[#F0F0F0] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#1D3661]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111111] truncate">{inhalt.titel}</p>
        <p className="text-xs text-[#3BA9D3] mt-0.5">{bereichLabel}</p>
        {inhalt.beschreibung && (
          <p className="text-xs text-[#999999] mt-1 line-clamp-1">{inhalt.beschreibung}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="w-9 h-9 rounded-[12px] bg-[#F0F0F0] flex items-center justify-center shrink-0 active:opacity-70"
        aria-label="Löschen"
      >
        <Trash2 className="w-4 h-4 text-[#CE132D]" />
      </button>
    </div>
  );
}

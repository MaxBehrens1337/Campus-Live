"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Kurs } from "@/types/lms";

export function AdminFragenView() {
  const router = useRouter();
  const sb = createClient();
  const [kurse, setKurse] = useState<Kurs[]>([]);

  useEffect(() => {
    sb.from("kurse").select("*").order("reihenfolge").then(({ data }) => setKurse(data ?? []));
  }, []); // eslint-disable-line

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
        <div>
          <p className="text-xs text-white/60">Admin</p>
          <h1 className="text-base font-bold">Fragenverwaltung</h1>
        </div>
      </header>
      <main className="flex-1 p-5 flex flex-col gap-3">
        <p className="text-sm text-[#666666]">Wählen Sie einen Kurs, um dessen Fragen zu bearbeiten:</p>
        {kurse.map(k => (
          <button key={k.id} onClick={() => router.push(`./kurse/${k.id}`)}
            className="bg-white rounded-[20px] p-4 flex items-center gap-3 text-left active:opacity-75">
            <div className="w-10 h-10 rounded-[12px] bg-[#F0F0F0] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-[#1D3661]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">{k.titel}</p>
              <p className={`text-xs mt-0.5 ${k.status === "veroeffentlicht" ? "text-[#AFCA05]" : "text-[#999999]"}`}>
                {k.status === "veroeffentlicht" ? "Veröffentlicht" : "Entwurf"}
              </p>
            </div>
          </button>
        ))}
      </main>
    </div>
  );
}

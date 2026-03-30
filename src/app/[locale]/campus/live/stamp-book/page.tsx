"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { StampBookView } from "@/components/campus/stamp-book/stamp-book-view";

export default function StampBookPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center active:opacity-70"
          aria-label="Zurück"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Mein Stempelheft</h1>
      </header>
      <main className="flex-1 p-5">
        <StampBookView />
      </main>
    </div>
  );
}

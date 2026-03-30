"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Inhalt } from "@/types/inhalte";

export function InhaltViewer({ bereich, id }: { bereich: string; id: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [inhalt, setInhalt] = useState<Inhalt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function laden() {
      const { data } = await supabase
        .from("inhalte")
        .select("*")
        .eq("id", id)
        .single();
      setInhalt(data);
      setLoading(false);
    }
    laden();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const videoUrl = inhalt?.video_url ?? inhalt?.datei_url ?? null;
  const pdfUrl = inhalt?.datei_url ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      {/* Header */}
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-[12px] bg-white/10 flex items-center justify-center active:opacity-70"
          aria-label="Zurück"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold leading-tight flex-1 truncate">
          {loading ? "Laden …" : inhalt?.titel ?? "Inhalt"}
        </h1>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#3BA9D3] border-t-transparent animate-spin" />
        </div>
      ) : !inhalt ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-sm text-[#666666]">Inhalt nicht gefunden.</p>
        </div>
      ) : (
        <main className="flex-1 flex flex-col">
          {/* Video Player */}
          {inhalt.datei_typ === "video" && videoUrl && (
            <div className="bg-black aspect-video w-full">
              {videoUrl.includes("youtube") || videoUrl.includes("youtu.be") ? (
                <iframe
                  src={youtubeEmbedUrl(videoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : videoUrl.includes("vimeo") ? (
                <iframe
                  src={vimeoEmbedUrl(videoUrl)}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full"
                  playsInline
                />
              )}
            </div>
          )}

          {/* PDF Viewer */}
          {inhalt.datei_typ === "pdf" && pdfUrl && (
            <div className="flex-1 flex flex-col">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                className="flex-1 w-full"
                style={{ minHeight: "70vh" }}
                title={inhalt.titel}
              />
              <div className="p-4 flex gap-3">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-[48px] rounded-[16px] bg-[#1D3661] text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80"
                >
                  <ExternalLink className="w-4 h-4" />
                  Im Browser öffnen
                </a>
                <a
                  href={pdfUrl}
                  download
                  className="h-[48px] w-[48px] rounded-[16px] bg-[#F0F0F0] flex items-center justify-center active:opacity-70"
                  aria-label="Herunterladen"
                >
                  <Download className="w-5 h-5 text-[#1D3661]" />
                </a>
              </div>
            </div>
          )}

          {/* External Link */}
          {inhalt.datei_typ === "link" && (inhalt.datei_url ?? inhalt.video_url) && (
            <div className="flex-1 p-5 flex flex-col gap-4">
              <InhaltTextCard inhalt={inhalt} />
              <a
                href={inhalt.datei_url ?? inhalt.video_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="h-[52px] rounded-[16px] bg-[#3BA9D3] text-white font-semibold text-base flex items-center justify-center gap-2 active:opacity-80"
              >
                <ExternalLink className="w-5 h-5" />
                Link öffnen
              </a>
            </div>
          )}

          {/* Text / Artikel */}
          {(inhalt.datei_typ === "text" || !inhalt.datei_typ) && (
            <div className="flex-1 p-5">
              <InhaltTextCard inhalt={inhalt} />
            </div>
          )}
        </main>
      )}
    </div>
  );
}

function InhaltTextCard({ inhalt }: { inhalt: Inhalt }) {
  return (
    <div className="bg-white rounded-[24px] p-6 flex flex-col gap-3">
      <h2 className="text-[20px] font-bold text-[#1D3661]">{inhalt.titel}</h2>
      {inhalt.beschreibung && (
        <p className="text-sm text-[#666666] leading-relaxed">{inhalt.beschreibung}</p>
      )}
    </div>
  );
}

function youtubeEmbedUrl(url: string) {
  const match =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/) ?? [];
  const id = match[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
}

function vimeoEmbedUrl(url: string) {
  const match = url.match(/vimeo\.com\/(\d+)/) ?? [];
  const id = match[1];
  return id ? `https://player.vimeo.com/video/${id}` : url;
}

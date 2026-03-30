"use client";

import { ImageOff, Video, FileQuestion } from "lucide-react";

interface MediaPlaceholderProps {
  typ: "video" | "bild" | "quiz_bild";
  titel?: string;
  className?: string;
}

const config = {
  video: {
    Icon: Video,
    label: "Video folgt",
    sublabel: "Die Videodatei wird noch ergänzt.",
    bg: "bg-[#1D3661]/5",
    iconColor: "text-[#3BA9D3]",
  },
  bild: {
    Icon: ImageOff,
    label: "Bild wird ergänzt",
    sublabel: "Das Bild wird nachgeliefert.",
    bg: "bg-[#F0F0F0]",
    iconColor: "text-[#999999]",
  },
  quiz_bild: {
    Icon: FileQuestion,
    label: "Quizbild wird ergänzt",
    sublabel: "Die Bildoption steht noch aus.",
    bg: "bg-[#F0F0F0]",
    iconColor: "text-[#999999]",
  },
};

export function MediaPlaceholder({ typ, titel, className = "" }: MediaPlaceholderProps) {
  const c = config[typ];
  const Icon = c.Icon;

  return (
    <div className={`rounded-[16px] ${c.bg} border border-[#E0E0E0] flex flex-col items-center justify-center p-6 gap-3 min-h-[120px] ${className}`}>
      <div className="w-12 h-12 rounded-[12px] bg-white/80 flex items-center justify-center">
        <Icon className={`w-6 h-6 ${c.iconColor}`} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#666666]">{titel ?? c.label}</p>
        <p className="text-xs text-[#999999] mt-0.5">{c.sublabel}</p>
      </div>
    </div>
  );
}

/** Badge for source_status on cards */
export function QuellStatusBadge({ status }: { status: string }) {
  if (status === "vollstaendig") return null;

  const badges: Record<string, { label: string; bg: string; fg: string }> = {
    unvollstaendig: { label: "Unvollständig", bg: "bg-[#CE132D]/10", fg: "text-[#CE132D]" },
    medien_fehlen: { label: "Medien fehlen", bg: "bg-[#F59E0B]/10", fg: "text-[#B45309]" },
    redaktion_pruefen: { label: "Prüfen", bg: "bg-[#3BA9D3]/10", fg: "text-[#1D3661]" },
  };

  const b = badges[status] ?? badges.unvollstaendig;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-semibold ${b.bg} ${b.fg}`}>
      {b.label}
    </span>
  );
}

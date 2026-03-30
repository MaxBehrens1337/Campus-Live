"use client";

import { useRouter } from "next/navigation";
import { useCampusSession } from "@/lib/stores/campus-session";
import { QrCode, FileText, Star, Play } from "lucide-react";

interface Tile {
  key: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  progress: number;
  available: boolean;
}

export function DashboardGrid() {
  const router = useRouter();
  const session = useCampusSession((s) => s.session);

  const tiles: Tile[] = [
    {
      key: "online",
      label: "Campus Online",
      sublabel: "Dokumente & Videos",
      icon: FileText,
      href: "./online",
      progress: 0,
      available: true,
    },
    {
      key: "live1",
      label: "Campus Live 1.0",
      sublabel: "Grundlagen",
      icon: Star,
      href: "./live/1.0",
      progress: 0,
      available: true,
    },
    {
      key: "live2",
      label: "Campus Live 2.0",
      sublabel: "Aufbau",
      icon: Star,
      href: "./live/2.0",
      progress: 0,
      available: true,
    },
    {
      key: "webinare",
      label: "Webinare",
      sublabel: "Demnächst",
      icon: Play,
      href: "#",
      progress: 0,
      available: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F0F0]">
      {/* Header */}
      <header className="bg-[#1D3661] text-white px-5 py-4 flex items-center justify-between">
        <ThitronikLogo />
        <span className="text-sm font-medium bg-white/10 rounded-[999px] px-3 py-1.5">
          {session?.customerNumber ?? "—"}
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 p-5 flex flex-col gap-6">
        {/* Greeting */}
        <div>
          <h1 className="text-[22px] font-bold text-[#1D3661]">
            Guten Tag{session?.companyName ? `, ${session.companyName}` : ""}!
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            Wählen Sie Ihr Schulungsmodul.
          </p>
        </div>

        {/* 2x2 Tile Grid */}
        <div className="grid grid-cols-2 gap-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.key}
                onClick={() => tile.available && router.push(tile.href)}
                disabled={!tile.available}
                className="bg-white rounded-[16px] p-4 text-left flex flex-col gap-3 min-h-[140px] active:opacity-75 transition-opacity disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-[12px] bg-[#F0F0F0] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#1D3661]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#111111] leading-tight">
                    {tile.label}
                  </p>
                  <p className="text-xs text-[#666666] mt-0.5">{tile.sublabel}</p>
                </div>
                <div className="w-full h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#AFCA05] rounded-full"
                    style={{ width: `${tile.progress}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* QR-Code Banner */}
        <button
          onClick={() => router.push("../scanner")}
          className="w-full bg-[#1D3661] text-white rounded-[16px] p-4 flex items-center gap-4 active:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-[12px] bg-white/10 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">QR-Code scannen</p>
            <p className="text-xs text-white/70 mt-0.5">Station direkt öffnen</p>
          </div>
        </button>
      </main>
    </div>
  );
}

function ThitronikLogo() {
  return (
    <svg
      width="140"
      height="34"
      viewBox="0 0 180 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Thitronik"
    >
      <path d="M10 38 L10 8 L34 22 Z" fill="#CE132D" />
      <text
        x="42"
        y="30"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="22"
        fill="#FFFFFF"
        letterSpacing="1"
      >
        THITRONIK
      </text>
    </svg>
  );
}

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Pen, Eraser, Trash2, Download, Minus, Plus,
  Square, Circle, Minus as LineIcon, Type, Undo2
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "pen" | "eraser" | "line" | "rect" | "circle" | "text";

interface Point { x: number; y: number; }

interface Stroke {
  tool: Tool;
  color: string;
  size: number;
  points: Point[];
  text?: string;
}

const COLORS = [
  "#FFFFFF", "#F97316", "#22C55E", "#3B82F6",
  "#EF4444", "#EAB308", "#A855F7", "#6B7280",
];

export function Whiteboard({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#FFFFFF");
  const [size, setSize] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const redraw = useCallback((strokeList: Stroke[], preview?: Stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const drawStroke = (s: Stroke) => {
      if (s.points.length === 0) return;
      ctx.strokeStyle = s.tool === "eraser" ? "#111827" : s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = s.tool === "eraser" ? s.size * 4 : s.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (s.tool === "pen" || s.tool === "eraser") {
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        s.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (s.tool === "line" && s.points.length >= 2) {
        const [start, end] = [s.points[0], s.points[s.points.length - 1]];
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
      } else if (s.tool === "rect" && s.points.length >= 2) {
        const [start, end] = [s.points[0], s.points[s.points.length - 1]];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (s.tool === "circle" && s.points.length >= 2) {
        const [start, end] = [s.points[0], s.points[s.points.length - 1]];
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = start.x + (end.x - start.x) / 2;
        const cy = start.y + (end.y - start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    strokeList.forEach(drawStroke);
    if (preview) drawStroke(preview);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    redraw(strokes);
  }, []);

  useEffect(() => {
    redraw(strokes, currentStroke ?? undefined);
  }, [strokes, currentStroke, redraw]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getPoint(e);
    setDrawing(true);
    setStartPoint(pt);
    const stroke: Stroke = { tool, color, size, points: [pt] };
    setCurrentStroke(stroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !currentStroke) return;
    const pt = getPoint(e);
    if (tool === "pen" || tool === "eraser") {
      setCurrentStroke((s) => s ? { ...s, points: [...s.points, pt] } : s);
    } else {
      setCurrentStroke((s) => s ? { ...s, points: [s.points[0], pt] } : s);
    }
  };

  const handlePointerUp = () => {
    if (!drawing || !currentStroke) return;
    setStrokes((s) => [...s, currentStroke]);
    setCurrentStroke(null);
    setDrawing(false);
    setStartPoint(null);
  };

  const handleUndo = () => setStrokes((s) => s.slice(0, -1));
  const handleClear = () => setStrokes([]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "thitronik-whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const tools: { id: Tool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: "pen", icon: Pen, label: "Stift" },
    { id: "eraser", icon: Eraser, label: "Radierer" },
    { id: "line", icon: LineIcon, label: "Linie" },
    { id: "rect", icon: Square, label: "Rechteck" },
    { id: "circle", icon: Circle, label: "Ellipse" },
  ];

  return (
    <div className={cn("flex flex-col bg-[#0B0F1A] rounded-2xl overflow-hidden border border-white/10", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-[#111827] flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {tools.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              title={label}
              onClick={() => setTool(id)}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer",
                tool === id ? "bg-orange-500 text-white" : "text-white/40 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-white/10" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-transform cursor-pointer",
                color === c ? "scale-125 border-white" : "border-transparent hover:scale-110"
              )}
              style={{ background: c }}
            />
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-white/10" />

        {/* Size */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSize((s) => Math.max(1, s - 1))}
            className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-xs text-white/50 w-4 text-center tabular-nums">{size}</span>
          <button
            onClick={() => setSize((s) => Math.min(20, s + 1))}
            className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white cursor-pointer"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={handleUndo}
          title="Rückgängig"
          className="w-8 h-8 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={handleClear}
          title="Alles löschen"
          className="w-8 h-8 rounded-md flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          onClick={handleDownload}
          title="Herunterladen"
          className="w-8 h-8 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 w-full touch-none"
        style={{ cursor: tool === "eraser" ? "cell" : "crosshair", minHeight: 400 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}

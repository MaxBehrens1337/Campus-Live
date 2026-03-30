"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
  fire: boolean;
  onFired?: () => void;
  type?: "burst" | "stars" | "fireworks";
}

export function Confetti({ fire, onFired, type = "burst" }: ConfettiProps) {
  useEffect(() => {
    if (!fire) return;

    const end = Date.now() + 2 * 1000;
    const colors = ["#CE132D", "#1D3661", "#AFCA05", "#3BA9D3", "#FFFFFF"];

    if (type === "burst") {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors,
        disableForReducedMotion: true,
      });
      onFired?.();
    } else if (type === "fireworks") {
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        } else {
          onFired?.();
        }
      })();
    } else if (type === "stars") {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval = setInterval(function () {
        const timeLeft = end - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          onFired?.();
          return;
        }
        const particleCount = 50 * (timeLeft / 2000);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ["#AFCA05", "#FFE066"] }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ["#AFCA05", "#FFE066"] }));
      }, 250);
    }
  }, [fire, onFired, type]);

  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function QRScanner() {
  const t = useTranslations("scanner");
  const router = useRouter();
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (decodedText: string) => {
    // Expected format: campus://station/{stationId}/game/{gameId}
    const match = decodedText.match(/^campus:\/\/station\/([^/]+)\/game\/([^/]+)$/);
    if (match) {
      const [, stationId, gameId] = match;
      router.push(`/campus/live/1.0/island-1/${stationId}`);
    } else {
      toast.error(t("error"));
    }
  };

  const startScanning = async () => {
    setScanning(true);
    setError(null);

    try {
      // Dynamically import html5-qrcode to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      );
    } catch {
      setError(t("permission"));
      setScanning(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <Camera className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <div id="qr-reader" ref={scannerRef} className="w-full" />
        {!scanning && (
          <Button className="w-full" onClick={startScanning}>
            {t("scanning")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

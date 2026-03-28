"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStampBook } from "@/lib/stores/stamp-book";
import { toast } from "sonner";

interface StationViewProps {
  version: string;
  islandId: string;
  stationId: string;
}

export function StationView({ version, islandId, stationId }: StationViewProps) {
  const t = useTranslations("campusLive");
  const router = useRouter();
  const updateStamp = useStampBook((s) => s.updateStamp);

  const handleComplete = () => {
    updateStamp(stationId, "completed", 100);
    toast.success(t("stationComplete"));
    router.back();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Station: {stationId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Mini-Game wird hier gerendert (Typ wird aus Supabase geladen).
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              {t("title", { version: "" }).replace("Campus Live ", "")}
              Zurück
            </Button>
            <Button onClick={handleComplete}>Station abschließen</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

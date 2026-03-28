"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStampBook } from "@/lib/stores/stamp-book";
import { cn } from "@/lib/utils";

interface StationListProps {
  version: string;
  islandId: string;
}

// Placeholder – will come from Supabase
const PLACEHOLDER_STATIONS = [
  { id: "s1", title: "WiPro III Grundlagen", gameType: "quiz", minutes: 18 },
  { id: "s2", title: "Funk-Magnetkontakte", gameType: "ordering", minutes: 18 },
  { id: "s3", title: "Produktkonfigurator", gameType: "configurator", minutes: 18 },
];

export function StationList({ version, islandId }: StationListProps) {
  const t = useTranslations("campusLive");
  const router = useRouter();
  const { isStationComplete } = useStampBook();

  return (
    <div className="container mx-auto py-8 px-4 space-y-4">
      <h1 className="text-2xl font-bold">Insel-Stationen</h1>

      <div className="grid gap-3">
        {PLACEHOLDER_STATIONS.map((station, idx) => {
          const complete = isStationComplete(station.id);
          return (
            <Card
              key={station.id}
              className={cn(
                "cursor-pointer hover:shadow-md transition-all",
                complete && "border-green-500"
              )}
              onClick={() =>
                router.push(`./${islandId}/${station.id}`)
              }
            >
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-base">{station.title}</CardTitle>
                {complete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Badge variant="outline">{station.gameType}</Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{station.minutes} min</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

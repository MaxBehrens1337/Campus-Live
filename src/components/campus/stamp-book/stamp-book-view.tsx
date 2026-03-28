"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStampBook } from "@/lib/stores/stamp-book";
import { cn } from "@/lib/utils";

// Placeholder – will come from Supabase
const ISLANDS = [
  {
    id: "island-1",
    title: "Insel 1: Alarmsysteme",
    stations: [
      { id: "s1", title: "WiPro III Grundlagen" },
      { id: "s2", title: "Funk-Magnetkontakte" },
      { id: "s3", title: "Produktkonfigurator" },
    ],
  },
  {
    id: "island-2",
    title: "Insel 2: Ortung & Vernetzung",
    stations: [
      { id: "s4", title: "Pro-finder GPS" },
      { id: "s5", title: "Vernetzungsmodul & App" },
    ],
  },
  {
    id: "island-3",
    title: "Insel 3: Gaswarnung",
    stations: [
      { id: "s6", title: "G.A.S.-pro III" },
      { id: "s7", title: "Einbau-Reihenfolge" },
      { id: "s8", title: "Fehlersuche" },
    ],
  },
];

export function StampBookView() {
  const t = useTranslations("stampBook");
  const { isStationComplete, getCompletedCount } = useStampBook();

  const total = ISLANDS.reduce((acc, i) => acc + i.stations.length, 0);
  const completed = getCompletedCount();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        <div className="flex items-center gap-3">
          <Progress value={(completed / total) * 100} className="flex-1" />
          <span className="text-sm font-medium">
            {completed}/{total}
          </span>
        </div>
      </div>

      {ISLANDS.map((island) => {
        const islandCompleted = island.stations.every((s) => isStationComplete(s.id));
        const islandCount = island.stations.filter((s) => isStationComplete(s.id)).length;

        return (
          <Card key={island.id} className={cn(islandCompleted && "border-green-500")}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">{island.title}</CardTitle>
              <Badge variant={islandCompleted ? "default" : "outline"}>
                {islandCount}/{island.stations.length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {island.stations.map((station) => {
                  const done = isStationComplete(station.id);
                  return (
                    <div
                      key={station.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={cn(done && "line-through text-muted-foreground")}>
                        {station.title}
                      </span>
                      {done && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {t("completed")}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

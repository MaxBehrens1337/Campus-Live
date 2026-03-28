"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useStampBook } from "@/lib/stores/stamp-book";
import { cn } from "@/lib/utils";

interface IslandOverviewProps {
  version: string;
}

// Placeholder island data – will be fetched from Supabase
const PLACEHOLDER_ISLANDS = [
  {
    id: "island-1",
    title: "Insel 1: Alarmsysteme",
    stationCount: 3,
    stationIds: ["s1", "s2", "s3"],
  },
  {
    id: "island-2",
    title: "Insel 2: Ortung & Vernetzung",
    stationCount: 2,
    stationIds: ["s4", "s5"],
  },
  {
    id: "island-3",
    title: "Insel 3: Gaswarnung & Sicherheit",
    stationCount: 3,
    stationIds: ["s6", "s7", "s8"],
  },
];

export function IslandOverview({ version }: IslandOverviewProps) {
  const t = useTranslations("campusLive");
  const router = useRouter();
  const { isStationComplete, getCompletedCount, stamps } = useStampBook();

  const totalStations = PLACEHOLDER_ISLANDS.reduce((acc, i) => acc + i.stationCount, 0);
  const completedCount = getCompletedCount();
  const allComplete = completedCount >= totalStations;

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title", { version })}</h1>
        <p className="text-muted-foreground">
          {t("progress", { completed: completedCount, total: totalStations })}
        </p>
        <Progress value={(completedCount / totalStations) * 100} className="h-2" />
      </div>

      <div className="grid gap-4">
        {PLACEHOLDER_ISLANDS.map((island, idx) => {
          const islandCompleted = island.stationIds.every((id) => isStationComplete(id));
          const islandProgress = island.stationIds.filter((id) => isStationComplete(id)).length;

          return (
            <Card
              key={island.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => router.push(`./${version}/${island.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{island.title}</CardTitle>
                {islandCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(islandProgress / island.stationCount) * 100}
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs text-muted-foreground">
                    {islandProgress}/{island.stationCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allComplete && (
        <div className="text-center space-y-4">
          <p className="text-green-600 font-medium">{t("allComplete")}</p>
          <Button size="lg" onClick={() => router.push("./quiz")}>
            {t("startQuiz")}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Shield, MapPin, BookOpen, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCampusSession } from "@/lib/stores/campus-session";
import { cn } from "@/lib/utils";

interface ModuleCard {
  key: string;
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  available: boolean;
}

export function DashboardGrid() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const session = useCampusSession((s) => s.session);

  const modules: ModuleCard[] = [
    {
      key: "live1",
      titleKey: "campusLive1",
      descKey: "campusLive1Desc",
      icon: Shield,
      href: "./live/1.0",
      available: true,
    },
    {
      key: "live2",
      titleKey: "campusLive2",
      descKey: "campusLive2Desc",
      icon: MapPin,
      href: "./live/2.0",
      available: true,
    },
    {
      key: "online",
      titleKey: "campusOnline",
      descKey: "campusOnlineDesc",
      icon: BookOpen,
      href: "./online",
      available: false,
    },
    {
      key: "webinars",
      titleKey: "webinars",
      descKey: "webinarsDesc",
      icon: Video,
      href: "./webinars",
      available: false,
    },
  ];

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("welcome", { company: session?.companyName ?? "Händler" })}
        </h1>
        <p className="text-muted-foreground mt-2">{t("selectModule")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.key}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                !mod.available && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => mod.available && router.push(mod.href)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-primary" />
                  {!mod.available && (
                    <Badge variant="secondary" className="text-xs">
                      bald
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base">{t(mod.titleKey as Parameters<typeof t>[0])}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t(mod.descKey as Parameters<typeof t>[0])}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

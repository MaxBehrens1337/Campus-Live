"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "@/lib/schemas/campus";
import { useCampusSession } from "@/lib/stores/campus-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const setSession = useCampusSession((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // TODO: Validate against Supabase
    setSession({
      registrationId: crypto.randomUUID(),
      companyName: data.companyName,
      customerNumber: data.customerNumber,
      eventId: "placeholder-event-id",
    });
    router.push("../campus");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">{t("companyName")}</Label>
            <Input
              id="companyName"
              placeholder={t("companyNamePlaceholder")}
              {...register("companyName")}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerNumber">{t("customerNumber")}</Label>
            <Input
              id="customerNumber"
              placeholder={t("customerNumberPlaceholder")}
              {...register("customerNumber")}
            />
            {errors.customerNumber && (
              <p className="text-sm text-destructive">{errors.customerNumber.message}</p>
            )}
            <p className="text-xs text-muted-foreground">{t("hint")}</p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "..." : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/campus/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800">
      <LoginForm />
    </main>
  );
}

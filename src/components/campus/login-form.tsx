"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/schemas/campus";
import { useCampusSession } from "@/lib/stores/campus-session";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const setSession = useCampusSession((s) => s.setSession);
  const supabase = createClient();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const { data: rows, error } = await supabase.rpc("login_haendler", {
      p_kundennummer: data.customerNumber,
      p_passwort:     data.passwort,
    });

    if (error || !rows || rows.length === 0) {
      toast.error("Kundennummer oder Passwort falsch.");
      return;
    }

    const haendler = rows[0];
    setSession({
      registrationId: haendler.id,
      companyName:    haendler.firmenname ?? data.customerNumber,
      customerNumber: haendler.kundennummer,
      eventId:        "campus-online",
    });

    router.push("../campus");
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Logo */}
      <div className="flex justify-center mb-10">
        <ThitronikLogo />
      </div>

      {/* Card */}
      <div className="bg-white rounded-[24px] p-8">
        <h1 className="text-[28px] font-bold text-[#1D3661] mb-2">
          Willkommen
        </h1>
        <p className="text-sm text-[#666666] mb-8">
          Bitte melden Sie sich mit Ihrer Kundennummer und Ihrem Passwort an.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          {/* Kundennummer */}
          <div>
            <label
              htmlFor="customerNumber"
              className="block text-sm font-semibold text-[#111111] mb-2"
            >
              Kundennummer
            </label>
            <input
              id="customerNumber"
              type="text"
              inputMode="numeric"
              placeholder="z. B. 12345"
              autoComplete="username"
              className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-[#111111] text-base placeholder:text-[#999999] outline-none focus:border-[#3BA9D3] focus:bg-white transition-colors"
              {...register("customerNumber")}
            />
            {errors.customerNumber && (
              <p className="mt-1.5 text-sm text-[#CE132D]">
                {errors.customerNumber.message}
              </p>
            )}
          </div>

          {/* Passwort */}
          <div>
            <label
              htmlFor="passwort"
              className="block text-sm font-semibold text-[#111111] mb-2"
            >
              Passwort
            </label>
            <div className="relative">
              <input
                id="passwort"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-[52px] pl-4 pr-12 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-[#111111] text-base placeholder:text-[#999999] outline-none focus:border-[#3BA9D3] focus:bg-white transition-colors"
                {...register("passwort")}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] active:opacity-60"
                aria-label={showPw ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.passwort && (
              <p className="mt-1.5 text-sm text-[#CE132D]">
                {errors.passwort.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full h-[52px] rounded-[16px] bg-[#1D3661] text-white font-semibold text-base transition-opacity disabled:opacity-40 active:opacity-80"
          >
            {isSubmitting ? "Anmelden …" : "Anmelden"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-[#999999]">
        Thitronik GmbH · Campus Online
      </p>
    </div>
  );
}

function ThitronikLogo() {
  return (
    <svg
      width="180"
      height="44"
      viewBox="0 0 180 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Thitronik"
    >
      <path d="M10 38 L10 8 L34 22 Z" fill="#CE132D" />
      <text
        x="42"
        y="30"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="22"
        fill="#1D3661"
        letterSpacing="1"
      >
        THITRONIK
      </text>
    </svg>
  );
}

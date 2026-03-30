"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "@/lib/schemas/campus";
import { useCampusSession } from "@/lib/stores/campus-session";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const setSession = useCampusSession((s) => s.setSession);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const { data: haendler, error } = await supabase
      .from("haendler")
      .select("*")
      .eq("kundennummer", data.customerNumber)
      .single();

    if (error || !haendler) {
      toast.error("Kundennummer nicht gefunden. Bitte prüfen Sie Ihre Eingabe.");
      return;
    }

    setSession({
      registrationId: haendler.id,
      companyName: haendler.firmenname ?? data.customerNumber,
      customerNumber: haendler.kundennummer,
      eventId: "campus-online",
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
          Bitte geben Sie Ihre Kundennummer ein, um sich anzumelden.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
            autoComplete="off"
            className="w-full h-[52px] px-4 rounded-[16px] border border-[#E0E0E0] bg-[#F0F0F0] text-[#111111] text-base placeholder:text-[#999999] outline-none focus:border-[#3BA9D3] focus:bg-white transition-colors"
            {...register("customerNumber")}
          />
          {errors.customerNumber && (
            <p className="mt-2 text-sm text-[#CE132D]">
              {errors.customerNumber.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full h-[52px] rounded-[16px] bg-[#1D3661] text-white font-semibold text-base transition-opacity disabled:opacity-40 active:opacity-80"
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

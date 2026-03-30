import { createClient } from "@/lib/supabase/client";
import type { Kurs, Lektion, Frage, Antwortoption, Quiz, Lernfortschritt } from "@/types/lms";

export function useSupabase() {
  return createClient();
}

// ── Kurse ──────────────────────────────────────────────────────
export async function getKurse() {
  const sb = createClient();
  const { data } = await sb
    .from("kurse")
    .select("*")
    .order("reihenfolge");
  return data ?? [];
}

export async function getKurs(slug: string): Promise<Kurs | null> {
  const sb = createClient();
  const { data } = await sb.from("kurse").select("*").eq("slug", slug).single();
  return data;
}

// ── Lektionen ──────────────────────────────────────────────────
export async function getLektionen(kursId: string): Promise<Lektion[]> {
  const sb = createClient();
  const { data } = await sb
    .from("lektionen")
    .select("*")
    .eq("kurs_id", kursId)
    .order("reihenfolge");
  return data ?? [];
}

export async function getLektion(id: string): Promise<Lektion | null> {
  const sb = createClient();
  const { data } = await sb.from("lektionen").select("*").eq("id", id).single();
  return data;
}

// ── Quiz + Fragen ───────────────────────────────────────────────
export async function getQuizFuerLektion(lektionId: string): Promise<Quiz | null> {
  const sb = createClient();
  const { data } = await sb.from("quizze").select("*").eq("lektion_id", lektionId).single();
  return data;
}

export async function getFragenMitAntworten(quizId: string): Promise<Frage[]> {
  const sb = createClient();
  const { data } = await sb
    .from("fragen")
    .select("*, antwortoptionen(*)")
    .eq("quiz_id", quizId)
    .order("reihenfolge");
  return (data ?? []) as Frage[];
}

// ── Fortschritt ────────────────────────────────────────────────
export async function getFortschritt(
  haendlerId: string,
  kursId: string
): Promise<{ prozent: number; abgeschlossen: number; gesamt: number }> {
  const sb = createClient();

  const { data: lektionen } = await sb
    .from("lektionen")
    .select("id")
    .eq("kurs_id", kursId)
    .eq("status", "veroeffentlicht");

  const lektionIds = (lektionen ?? []).map((l) => l.id);
  if (lektionIds.length === 0) return { prozent: 0, abgeschlossen: 0, gesamt: 0 };

  const { data: fortschritt } = await sb
    .from("lernfortschritt")
    .select("lektion_id, status")
    .eq("haendler_id", haendlerId)
    .in("lektion_id", lektionIds);

  const abgeschlossen = (fortschritt ?? []).filter((f) => f.status === "abgeschlossen").length;
  const prozent = Math.round((abgeschlossen / lektionIds.length) * 100);

  return { prozent, abgeschlossen, gesamt: lektionIds.length };
}

export async function setLektionAbgeschlossen(
  haendlerId: string,
  lektionId: string
): Promise<void> {
  const sb = createClient();
  await sb.from("lernfortschritt").upsert(
    {
      haendler_id: haendlerId,
      lektion_id: lektionId,
      status: "abgeschlossen",
      prozent: 100,
      abgeschlossen_am: new Date().toISOString(),
    },
    { onConflict: "haendler_id,lektion_id" }
  );
}

// ── Quiz speichern ──────────────────────────────────────────────
export async function quizVersuchSpeichern(
  haendlerId: string,
  quizId: string,
  antworten: { frage_id: string; antwort_option_id: string; ist_korrekt: boolean }[],
  punkte: number,
  maxPunkte: number,
  mindestquote: number
) {
  const sb = createClient();
  const bestanden = maxPunkte > 0 ? (punkte / maxPunkte) * 100 >= mindestquote : true;

  const { data: versuch } = await sb
    .from("quiz_versuche")
    .insert({
      haendler_id: haendlerId,
      quiz_id: quizId,
      abgeschlossen_am: new Date().toISOString(),
      punkte,
      max_punkte: maxPunkte,
      bestanden,
    })
    .select()
    .single();

  if (versuch) {
    await sb.from("quiz_antworten").insert(
      antworten.map((a) => ({ ...a, versuch_id: versuch.id }))
    );
  }

  return { bestanden, prozent: maxPunkte > 0 ? Math.round((punkte / maxPunkte) * 100) : 100 };
}

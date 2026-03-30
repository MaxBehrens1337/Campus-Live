import { createClient } from "@/lib/supabase/client";
import type { Kurs, Lektion, Frage, Antwortoption, Quiz, Lernfortschritt, FrageMitAntworten } from "@/types/lms";

export function useSupabase() {
  return createClient();
}

// ── Kurse ──────────────────────────────────────────────────────
export async function getKurse(nurVeroeffentlicht = true) {
  const sb = createClient();
  let query = sb.from("kurse").select("*").order("reihenfolge");
  if (nurVeroeffentlicht) query = query.eq("status", "veroeffentlicht");
  const { data } = await query;
  return (data ?? []) as Kurs[];
}

export async function getKurs(slug: string): Promise<Kurs | null> {
  const sb = createClient();
  const { data } = await sb.from("kurse").select("*").eq("slug", slug).single();
  return data;
}

// ── Lektionen ──────────────────────────────────────────────────
export async function getLektionen(kursId: string, nurVeroeffentlicht = true): Promise<Lektion[]> {
  const sb = createClient();
  let query = sb.from("lektionen").select("*").eq("kurs_id", kursId).order("reihenfolge");
  if (nurVeroeffentlicht) query = query.eq("status", "veroeffentlicht");
  const { data } = await query;
  return (data ?? []) as Lektion[];
}

export async function getLektion(id: string): Promise<Lektion | null> {
  const sb = createClient();
  const { data } = await sb.from("lektionen").select("*").eq("id", id).single();
  return data;
}

// ── Inhaltsblöcke ──────────────────────────────────────────────
export async function getInhaltsbloecke(lektionId: string) {
  const sb = createClient();
  const { data } = await sb
    .from("inhaltsbloecke")
    .select("*, medien_asset:medien_assets(*)")
    .eq("lektion_id", lektionId)
    .order("reihenfolge");
  return data ?? [];
}

// ── Quiz + Fragen ───────────────────────────────────────────────
export async function getQuizFuerLektion(lektionId: string): Promise<Quiz | null> {
  const sb = createClient();
  const { data } = await sb.from("quizze").select("*").eq("lektion_id", lektionId).single();
  return data;
}

export async function getFragenMitAntworten(quizId: string): Promise<FrageMitAntworten[]> {
  const sb = createClient();
  const { data } = await sb
    .from("fragen")
    .select("*, antwortoptionen(*)")
    .eq("quiz_id", quizId)
    .order("reihenfolge");
  return (data ?? []) as FrageMitAntworten[];
}

// ── Fortschritt ────────────────────────────────────────────────
export async function getFortschritt(
  userId: string,
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
    .eq("user_id", userId)
    .in("lektion_id", lektionIds);

  const abgeschlossen = (fortschritt ?? []).filter((f) => f.status === "abgeschlossen").length;
  const prozent = Math.round((abgeschlossen / lektionIds.length) * 100);

  return { prozent, abgeschlossen, gesamt: lektionIds.length };
}

export async function setLektionAbgeschlossen(
  userId: string,
  lektionId: string
): Promise<void> {
  const sb = createClient();
  await sb.from("lernfortschritt").upsert(
    {
      user_id: userId,
      lektion_id: lektionId,
      status: "abgeschlossen",
      prozent: 100,
      abgeschlossen_am: new Date().toISOString(),
    },
    { onConflict: "user_id,lektion_id" }
  );
}

// ── Quiz speichern ──────────────────────────────────────────────
export async function quizVersuchSpeichern(
  userId: string,
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
      user_id: userId,
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

// ── Auth helper ─────────────────────────────────────────────────
export async function getCurrentUser() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function getCurrentProfil() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

// ── Admin Queries ───────────────────────────────────────────────
export async function getAdminStats() {
  const sb = createClient();
  const [kurse, fragen, notizen] = await Promise.all([
    sb.from("kurse").select("id, quell_status, fragen_anzahl", { count: "exact" }),
    sb.from("fragen").select("id, inhalt_status", { count: "exact" }),
    sb.from("redaktionelle_notizen").select("id, status", { count: "exact" }).eq("status", "offen"),
  ]);

  const alleKurse = kurse.data ?? [];
  const alleFragen = fragen.data ?? [];

  return {
    kurseGesamt: alleKurse.length,
    fragenGesamt: alleFragen.length,
    unvollstaendig: alleFragen.filter(f => f.inhalt_status === "unvollstaendig").length,
    medienFehlen: alleFragen.filter(f => f.inhalt_status === "medien_fehlen").length,
    offeneNotizen: notizen.count ?? 0,
  };
}

// ============================================================================
// THITRONIK Campus – SQL Seed Generator
// ============================================================================
// Run: npx tsx src/lib/seed/generate-seed-sql.ts > supabase/migrations/003_seed_doinstruct.sql
// ============================================================================

import { SEED_MODULE_1_7 } from './seed-modules-1-7';
import { SEED_MODULE_8_13 } from './seed-modules-8-13';
import type { SeedModul, SeedFrage } from './seed-modules-1-7';

const ALL_MODULES = [...SEED_MODULE_1_7, ...SEED_MODULE_8_13];

function esc(s: string | null | undefined): string {
  if (!s) return 'NULL';
  return `'${s.replace(/'/g, "''")}'`;
}

function bool(b: boolean): string {
  return b ? 'true' : 'false';
}

function generateSQL(): string {
  const lines: string[] = [
    '-- ============================================================================',
    '-- THITRONIK Campus Academy – Doinstruct Content Seed',
    '-- ============================================================================',
    '-- Auto-generated from TypeScript seed data.',
    `-- Generated: ${new Date().toISOString()}`,
    '-- Module count: ' + ALL_MODULES.length,
    '-- Total questions: ' + ALL_MODULES.reduce((sum, m) => sum + m.fragen.length, 0),
    '-- ============================================================================',
    '',
    'BEGIN;',
    '',
    '-- ── Import protocol entry ────────────────────────────────────────────────',
    `INSERT INTO import_protokoll (quell_datei, status, bericht) VALUES ('doinstruct-gesamt', 'abgeschlossen', '{"module": ${ALL_MODULES.length}, "fragen": ${ALL_MODULES.reduce((s, m) => s + m.fragen.length, 0)}}');`,
    '',
  ];

  ALL_MODULES.forEach((modul, mIdx) => {
    const kursVar = `kurs_${mIdx + 1}`;
    const lektionVar = `lektion_${mIdx + 1}`;
    const quizVar = `quiz_${mIdx + 1}`;

    lines.push(`-- ── Module ${mIdx + 1}: ${modul.titel} ──`);
    lines.push(`DO $$ DECLARE ${kursVar} UUID; ${lektionVar} UUID; ${quizVar} UUID; frage_id UUID; BEGIN`);

    // Insert kurs
    lines.push(`  INSERT INTO kurse (slug, titel, beschreibung, status, quell_status, quell_datei, fragen_anzahl, hat_video, hat_bilder, reihenfolge)`);
    lines.push(`  VALUES (${esc(modul.slug)}, ${esc(modul.titel)}, ${esc(modul.beschreibung)}, 'veroeffentlicht', ${esc(modul.quell_status)}, ${esc(modul.quell_datei)}, ${modul.fragen.length}, ${bool(modul.hat_video)}, ${bool(modul.hat_bilder)}, ${(mIdx + 1) * 10})`);
    lines.push(`  RETURNING id INTO ${kursVar};`);

    // Insert lektion (one per module for now)
    lines.push(`  INSERT INTO lektionen (kurs_id, slug, titel, beschreibung, status, quell_status, reihenfolge)`);
    lines.push(`  VALUES (${kursVar}, ${esc(modul.slug + '-quiz')}, ${esc(modul.titel + ' – Quiz')}, ${esc('Wissenstest: ' + modul.titel)}, 'veroeffentlicht', ${esc(modul.quell_status)}, 10)`);
    lines.push(`  RETURNING id INTO ${lektionVar};`);

    // Insert quiz
    lines.push(`  INSERT INTO quizze (lektion_id, titel, modus, mindestquote)`);
    lines.push(`  VALUES (${lektionVar}, ${esc(modul.titel + ' Quiz')}, 'sofort', 70)`);
    lines.push(`  RETURNING id INTO ${quizVar};`);

    // Insert fragen + antworten
    modul.fragen.forEach((frage, fIdx) => {
      lines.push(`  -- Frage ${fIdx + 1}`);
      lines.push(`  INSERT INTO fragen (quiz_id, typ, fragetext, reihenfolge, mehrere_korrekt, inhalt_status, quell_datei, notizen_redaktion)`);
      lines.push(`  VALUES (${quizVar}, ${esc(frage.typ)}, ${esc(frage.fragetext)}, ${(fIdx + 1) * 10}, ${bool(frage.mehrere_korrekt)}, ${esc(frage.inhalt_status)}, ${esc(modul.quell_datei)}, ${esc(frage.notizen_redaktion ?? null)})`);
      lines.push(`  RETURNING id INTO frage_id;`);

      frage.antworten.forEach((antw, aIdx) => {
        lines.push(`  INSERT INTO antwortoptionen (frage_id, text, option_typ, ist_korrekt, reihenfolge, quell_status)`);
        lines.push(`  VALUES (frage_id, ${esc(antw.text)}, ${esc(antw.option_typ)}, ${bool(antw.ist_korrekt)}, ${(aIdx + 1) * 10}, ${esc(antw.quell_status)});`);
      });
    });

    lines.push('END $$;');
    lines.push('');
  });

  lines.push('COMMIT;');
  return lines.join('\n');
}

console.log(generateSQL());

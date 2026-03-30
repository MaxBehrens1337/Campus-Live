# THITRONIK Campus Academy – Backlog & Issues

This document tracks the known issues, feature requests, and next steps for the Campus Academy MVP. These should be transferred to GitHub Issues for proper agile tracking.

## 🔴 High Priority / Bugs

### 1. Missing Actual Media Assets (Videos & Images)
- **Description**: The database `inhaltsbloecke` currently uses Doinstruct placeholder text for media. The `lektion-view.tsx` falls back to rendering a `MediaPlaceholder` because we don't have the actual THITRONIK video URLs/files uploaded to Supabase Storage yet.
- **Action**: Upload MP4 videos to a Supabase Storage bucket (`campus-media`), fetch public URLs, and update the `medien_assets` table and `inhaltsbloecke.media_asset_id` references.
- **Assignee**: Redaktion / Content Migration Team

### 2. User Profile Setup Flow
- **Description**: Currently, users are created via the Supabase Auth generic UI and their `profiles` row is auto-generated. We need a proper "My Profile" page (`/campus/profil`) where users can add their `firmenname` and `kundennummer` (which are currently `null`).
- **Action**: Build `profil-view.tsx` and allow users to `UPDATE profiles SET firmenname = 'x' WHERE id = auth.uid()`.

## 🟡 Medium Priority / Enhancements

### 3. Editor Role Workflow
- **Description**: The `rolle` in `profiles` can be `editor`, but the UI doesn't explicitly distinguish editor powers from `admin` in `admin-panel.tsx`.
- **Action**: Restrict the ability to publish (`status = 'veroeffentlicht'`) to `admin` only. Allow `editor` to create drafts and set `quell_status = 'redaktion_pruefen'`.

### 4. Custom Certificate Generation
- **Description**: When a learner finishes all lessons and quizzes in a module (Course Progress = 100%), they should receive a PDF certificate.
- **Action**: Implement a server-side route (`/api/generate-certificate`) using `pdf-lib` or a headless browser to generate a branded THITRONIK certificate PDF and email it via Resend or save it to Supabase Storage.

### 5. Leaderboard / Gamification Phase 2
- **Description**: We have Level-Up animations and Progress Rings. Next step is social proof.
- **Action**: Add a leaderboard showing top learners (dealers) based on their `lernfortschritt` points to drive engagement.

## 🟢 Low Priority / Tech Debt

### 6. Replace `canvas-confetti` with THITRONIK branded SVG particles
- **Description**: The current confetti is generic generic colored particles. It would be cooler if they were little THITRONIK logos or camper vans.
- **Action**: Customize the `canvas-confetti` implementation to use a custom SVG path.

### 7. Supabase CLI Migration
- **Description**: Currently, migrations are run manually via the Supabase Web SQL Editor (`004_all_in_one.sql`). 
- **Action**: Initialize `supabase init`, capture the remote schema, and move all SQL into `supabase/migrations` tracked by the CLI for automated CI/CD deployment.

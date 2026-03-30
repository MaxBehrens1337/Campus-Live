# THITRONIK Campus Academy 🎓

Welcome to the **THITRONIK Campus Academy**, the state-of-the-art Learning Management System (LMS) built specifically for THITRONIK partners, dealers, and employees. 

This platform replaces legacy PDF and flat-file trainings with a dynamic, gamified, and fully tracked digital learning experience.

![THITRONIK Logo](https://thitronik.de/wp-content/themes/thitronik/assets/img/logo.svg)

## 🚀 Tech Stack

- **Frontend Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (Gamification, Micro-interactions) + UI Glassmorphism
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password)
- **Language**: TypeScript (Strict Mode)

## ✨ Core Features

1. **Gamified Learner Dashboard**: Deep dark mode aesthetic, animated Progress Rings (`framer-motion`), and intuitive course progression.
2. **Content Renderer**: A robust rendering engine that dynamically loads `Inhaltsbloecke` (Markdown text, image placeholders, video placeholders) from the database.
3. **Interactive Quizzes**: Multiple choice and image-selection quizzes with automatic minimum-score validation and "Confetti" celebratory effects upon passing.
4. **Editorial Integrity System**: Every course and lesson tracks a `quell_status` (e.g., `vollstaendig`, `medien_fehlen`), allowing the UI to gracefully map missing media or incomplete sections without breaking.
5. **Admin & Content Management**: A role-based Admin Panel (`/campus/admin`) to oversee module statistics, creation, and user management.

## 🛠️ Local Development

### 1. Prerequisites
- Node.js 18+
- A Supabase Project (Free Tier is sufficient)

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Database Setup (Supabase)
The database structure is completely configured via SQL scripts.
1. Open the Supabase Dashboard -> SQL Editor.
2. Open `supabase/migrations/004_all_in_one.sql` from this repository.
3. Copy the entire content and run it. This will:
   - Reset the old schema.
   - Create all 15 tables and views with types.
   - Apply Row Level Security (RLS) policies.
   - Insert all 13 THITRONIK Seed Modules (Doinstruct text imports).

### 4. Create an Admin Account
1. In the Supabase Dashboard, go to **Authentication**.
2. Create a new user (e.g. `admin@thitronik.de`).
3. Go to the **Table Editor** -> `profiles`.
4. Change the `rolle` column for your new user from `lernender` to `admin`.

### 5. Start the Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000/de/campus/login](http://localhost:3000/de/campus/login) and log in!

## 🗺️ Project Structure

- `src/app/[locale]/campus/` - The core application routes
- `src/components/campus/` - React Components (UI, Gamification, Admin, Lernen)
- `src/lib/lms/` - Database queries and data-access layer
- `src/types/lms.ts` - Central domain models and TypeScript interfaces
- `supabase/migrations/` - SQL schema definitions and seed data

## 📝 Roadmap & Known Issues
Please see `docs/ISSUES.md` for the current backlog and next steps.

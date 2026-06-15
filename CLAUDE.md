# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**JourneyPad ("pal")** — a collaborative project-planning PWA. Users create "Journeys" (projects), build a nested task/section tree inside each, chat with teammates, and get AI assistance via an in-app co-pilot.

## Commands

```bash
npm run dev       # Start Vite dev server (HMR)
npm run build     # Production build to dist/
npm run preview   # Preview the production build locally
npm run lint      # ESLint across all .js/.jsx files
```

No test framework is installed.

## Environment Variables

Create `.env.local` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GROQ_API_KEY=...   # optional — users can also paste their key in Settings
```

## Tech Stack

- React 19 + Vite 8 (JSX only, no TypeScript)
- Tailwind CSS v4 via `@tailwindcss/vite` — **no `tailwind.config.js`**; theme tokens use CSS variables (e.g. `var(--bg-base)`)
- React Router v7
- Zustand v5 (state — all stores use `persist` middleware with localStorage)
- Supabase JS v2 (auth + database + real-time)
- Groq API (`llama-3.1-8b-instant`) for AI features — NOT Gemini
- Lucide React (icons), GSAP (animations), Sonner (toasts), ReactFlow + Mermaid (diagrams), vite-plugin-pwa

## Architecture

### Routes & Pages (`src/pages/`)

| Route | Component | Guard |
|---|---|---|
| `/` | `Landing` | GuestGuard |
| `/login`, `/register` | `Auth` | GuestGuard |
| `/dashboard` | `Dashboard` | Auth required |
| `/new-journey` | `NewJourney` | Auth required |
| `/journey/:id` | `Workspace` | Auth required |
| `/journey/:id/section/:sectionId` | `SectionRoadmap` | Auth required |
| `/journey/:id/chat` | `JourneyChat` | Auth required |
| `/journey/:id/team` | `JourneyTeam` | Auth required |
| `/calendar` | `Calendar` | Auth required |
| `/settings` | `Settings` | Auth required |

`App.jsx` wraps everything in `<AppInit>` (initialises auth + loads data), `<ThemeInit>` (applies `light` class to `<html>`), and `<Guard>` / `<GuestGuard>` per route.

### Zustand Stores (`src/store/`)

- **`useAuthStore`** — Supabase session, user profile (`id`, `email`, `username`, `designation`), streak tracking, `users[]` (all profiles for assignment). Persisted key: none (not persisted).
- **`useProjectStore`** — All app data. Persisted key: `pal-projects`.
  - `journeys[]` — flat list of Journey objects
  - `nodes[journeyId]` — flat Node[] per journey; tree is reconstructed from `parentId` at render time
  - `activities[]`, `taskMessages[taskId]`, `journeyMessages[journeyId]`
  - `chats[journeyId]`, `chatMessages[chatId]` — production team chat
  - `teamMembers[journeyId]` — member list with roles
  - `joinedJourneys[]` — IDs of journeys joined via invite link
  - All mutations optimistically update Zustand then fire a Supabase query; no rollback on error.
- **`useThemeStore`** — `theme: 'dark' | 'light'`. Persisted key: `pal-theme`.
- **`useToastStore`** — ephemeral toast queue (used by `src/components/UI/Toast.jsx`).

### Supabase Tables

`journeys`, `nodes`, `activities`, `task_messages`, `journey_messages`, `chats`, `messages`, `journey_members`, `profiles`

DB column names are snake_case; the store maps them to camelCase via `journeyFromDB`, `nodeFromDB`, `msgFromDB` functions in `useProjectStore.js`.

### Data Model — Nodes

Nodes are the core content unit. They are stored flat in Supabase and in Zustand (`nodes[journeyId]` is a plain array). Tree structure comes from `parentId`/`sort_order`. Node `type` is either `'header'` (a section/phase) or a task type (checkboxes, etc.). `DocumentTree.jsx` renders this recursively.

### Role-Based Access

`src/lib/useJourneyRole.js` exports:
- `useJourneyRole(journeyId)` — returns `'owner' | 'editor' | 'uploader' | 'viewer'`
- `canEdit(role)` — owner or editor
- `canUpload(role)` — owner, editor, or uploader

The owner is determined by `journey.ownerId === user.id`; others come from the `journey_members` table.

### AI (Groq)

`src/lib/groqClient.js` calls Groq's OpenAI-compatible endpoint. The API key is read from `localStorage('pal-groq-key')`, falling back to `VITE_GROQ_API_KEY`. There is a 5-request/day client-side limit tracked in `localStorage('pal-ai-usage')`. Two AI tool calls are defined: `create_journey` and `create_section`.

### Colors & Theming

Journey accent colors (`emerald | amber | violet | blue | rose | cyan`) are defined in `src/lib/colors.js` with full Tailwind class strings so the purger doesn't remove them. Always add new color classes there, not inline.

Tailwind v4 uses CSS variables for the dark/light theme; `light` class on `<html>` flips to light mode.

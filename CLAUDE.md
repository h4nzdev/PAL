# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**JourneyPad ("pal")** — a collaborative project-planning app with a unified workspace combining a nested task document tree and a context-aware AI co-pilot.

## Commands

```bash
npm run dev       # Start Vite dev server (HMR)
npm run build     # Production build to dist/
npm run preview   # Preview the production build locally
npm run lint      # ESLint across all .js/.jsx files
```

No test framework is installed yet.

## Current State

Bare Vite + React 19 scaffold. `src/App.jsx` and `src/index.css` are essentially empty — the full architecture below is planned but not yet built.

## Tech Stack (Installed)

- React 19 + Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite` — no `tailwind.config.js` needed)
- React Router v7
- Lucide React (icons), GSAP (animations)

**Not yet installed (planned):** Zustand (state), Supabase JS SDK (backend/auth), TypeScript.

## Target Architecture

**Routes:** `/login`, `/register`, `/dashboard`, `/journey/:id` (unified workspace), `/calendar`, `/settings`

**Planned folder structure:**
```
src/
├── components/UI/         # Buttons, GlassCard, Inputs, Modals
├── components/Workspace/  # Recursive NodeItem, DocumentTree editor
├── components/Dashboard/  # Progress rings, activity feed
├── pages/                 # One file per route
├── store/useProjectStore.ts  # Zustand — task tree + Supabase real-time sync
└── supabaseClient.ts         # Single Supabase client instance
```

**Key decisions:**
- Glassmorphism dark-mode UI with emerald or amber accent colors.
- `<NodeItem />` is a recursive component — the core building block for headers and nested checkboxes.
- Zustand holds the in-memory task tree; every checkbox toggle syncs to Supabase and propagates real-time to collaborators.
- The `/journey/:id` workspace intentionally unifies Plans, Tasks, and AI Chat in one three-panel layout (nav sidebar | document tree | AI chat).
- AI chat panel passes the full current project tree as context to the Gemini API.

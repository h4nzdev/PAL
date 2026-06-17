# JourneyPad

A collaborative project-planning PWA. Users create **Journeys** (projects), build a nested task/section tree inside each, chat with teammates, and get AI assistance via an in-app co-pilot.

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + Vite 8 (JSX) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Routing | React Router v7 |
| State | Zustand v5 (persisted to localStorage) |
| Backend | Supabase JS v2 (auth · database · realtime) |
| AI | Groq API — `llama-3.1-8b-instant` |
| Icons | Lucide React |
| Animations | GSAP |
| Toasts | Sonner |
| Diagrams | ReactFlow + Mermaid |
| PWA | vite-plugin-pwa |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key   # optional — users can paste their own key in Settings
```

### 3. Run the Supabase schema

Open the Supabase SQL editor and run `supabase_admin_schema.sql` from the project root to create all required tables, RLS policies, and helper functions.

### 4. Start the dev server

```bash
npm run dev
```

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
npm run lint      # ESLint across all .js/.jsx files
```

## Project Structure

```
src/
├── assets/          # Static images (logo, mascot)
├── components/
│   ├── Layout/      # Sidebar, BottomNav
│   ├── UI/          # Shared UI (Toast, PWAPrompt, EditableTitle…)
│   └── Workspace/   # DocumentTree, TaskDrawer, AIChat
├── lib/             # Utilities (colors, groqClient, clientMetrics, constants…)
├── pages/           # Route-level components
│   ├── Landing.jsx
│   ├── Auth.jsx
│   ├── Dashboard.jsx
│   ├── NewJourney.jsx
│   ├── Workspace.jsx
│   ├── SectionRoadmap.jsx
│   ├── JourneyChat.jsx
│   ├── JourneyTeam.jsx
│   ├── Calendar.jsx
│   ├── Settings.jsx
│   └── AdminPanel.jsx
└── store/           # Zustand stores (useAuthStore, useProjectStore, useThemeStore, useAdminStore)
```

## Routes

| Path | Page | Guard |
|---|---|---|
| `/` | Landing | Guest only |
| `/login` `/register` | Auth | Guest only |
| `/dashboard` | Dashboard | Auth required |
| `/new-journey` | New Journey | Auth required |
| `/journey/:id` | Workspace | Auth required |
| `/journey/:id/section/:sectionId` | Section Roadmap | Auth required |
| `/journey/:id/chat` | Journey Chat | Auth required |
| `/journey/:id/team` | Journey Team | Auth required |
| `/calendar` | Calendar | Auth required |
| `/settings` | Settings | Auth required |
| `/admin` | Admin Panel | Admin only |

## Data Model

### Journeys
Top-level projects. Each journey has a name, color accent, owner, and invite code.

### Nodes
The core content unit — stored flat in Supabase. Tree structure is derived from `parentId` / `sort_order`. Node `type` is either `header` (a section/phase) or `task`.

### Role-Based Access
Each journey member has one of four roles: `owner` · `editor` · `uploader` · `viewer`. Permissions cascade — owners can do everything, viewers can only read.

## AI Co-Pilot

- Powered by Groq (`llama-3.1-8b-instant`)
- API key sourced from `localStorage('pal-groq-key')`, falling back to `VITE_GROQ_API_KEY`
- 5 requests per day client-side limit (tracked in localStorage)
- Two AI tools: `create_journey` and `create_section`

## Admin Panel

Accessible at `/admin` to accounts listed in the `admin_users` Supabase table.

Features:
- **Overview** — live counts for users, journeys, tasks, activities, and AI calls today
- **Users** — searchable table with ban/unban and force-logout controls
- **AI Usage** — per-user daily usage with visual progress bars
- **Performance** — browser-reported JS heap and page load metrics
- **Activity Log** — last 200 app events

Force logout works via Supabase Realtime — no service role key required on the client.

## Theming

Tailwind v4 uses CSS custom properties for dark/light mode. Adding a `light` class to `<html>` switches to light mode. Journey accent colors are defined in `src/lib/colors.js` — always add new color entries there so Tailwind's purger retains the class strings.

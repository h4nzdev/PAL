# JourneyPad

A collaborative project-planning web app with a unified workspace combining a nested task document tree, section roadmaps, and a context-aware AI co-pilot. Built as a Progressive Web App — installable and offline-capable.

---

## Features

### Workspace
- **Journeys** — top-level projects, each with a color accent and progress tracking
- **Sections** — roadmap-style phases within a journey, created via a modal with a name and description
- **Tasks** — checkboxes with full detail drawers; progress rolls up to section and journey level in real time
- **Editable titles** — click-to-rename inline for journeys, sections, and tasks everywhere in the UI

### Task Detail Drawer
Five tabs per task:

| Tab | What it does |
|---|---|
| **Notes** | Freeform notes and acceptance criteria, auto-saved on blur |
| **Diagram** | Mermaid diagram editor with Code / live Preview toggle |
| **Files** | Image attachments stored as base64 (PNG, JPG, GIF, WebP) |
| **People** | Assign a team member from the registered user list |
| **Chat** | Per-task message thread, persisted in Supabase |

### Dashboard
- Stats row: active journeys · tasks completed · completion rate % · day streak
- Insight cards: overdue tasks and tasks due this week (only shown when relevant)
- Quick actions: New Journey, Calendar, Team & Settings, Activity Log
- Journey cards with progress rings and mini progress bars
- Activity feed showing the last 50 events

### Collaboration
- Assign tasks to team members via the People tab
- Per-task chat — messages stored in Supabase, fetched lazily when the Chat tab opens
- WebRTC call modal — local camera/mic preview, mute, camera toggle, invite link, hang-up; peer connection requires a signaling server for multi-user sessions

### Streak Tracking
- Increments once per calendar day when any task is checked off
- Resets if a day is skipped
- Shown as a flame badge in the dashboard header and as a dedicated stat card

### Calendar
- Month grid — all tasks with a due date auto-populate their cell
- Month navigation, today highlighted with an emerald circle

### PWA
- Installable on desktop and Android Chrome via the browser's "Install app" prompt
- Full offline support — Workbox precaches all JS, CSS, HTML, and SVG on first visit
- Auto-update prompt when a new build is deployed
- App icon uses the project logo

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` (no config file needed) |
| Routing | React Router v7 |
| State | Zustand v5 with `persist` middleware (localStorage cache) |
| Backend / Auth | Supabase (PostgreSQL + Supabase Auth) |
| Diagrams | Mermaid.js v11 (async API, lazy code-split by diagram type) |
| Icons | Lucide React |
| Animations | GSAP + CSS keyframes |
| PWA | vite-plugin-pwa (Workbox `generateSW` strategy) |

---

## Project Structure

```
pal/
├── .env                        # Supabase credentials (gitignored)
├── supabase_schema.sql         # Run this in the Supabase SQL Editor once
├── vite.config.js              # Vite + Tailwind + PWA plugin config
│
├── public/
│   ├── logo.png                # PWA app icon
│   ├── favicon.svg             # Browser tab icon
│   └── robots.txt
│
└── src/
    ├── App.jsx                 # Router, auth guards, AppInit (session restore + data load)
    ├── supabaseClient.js       # Single Supabase client instance
    ├── index.css               # Tailwind import + global keyframes
    │
    ├── store/
    │   ├── useAuthStore.js     # Supabase Auth — register, login, logout, profile, streak
    │   ├── useProjectStore.js  # Journeys, nodes, activities, messages — optimistic + Supabase sync
    │   └── useToastStore.js    # Toast notification queue
    │
    ├── lib/
    │   └── colors.js           # Journey color system (hex values + full Tailwind class strings)
    │
    ├── pages/
    │   ├── Landing.jsx         # Marketing landing page (guest-only)
    │   ├── Auth.jsx            # Login / Register — split layout
    │   ├── Dashboard.jsx       # Stats, journeys grid, activity feed
    │   ├── NewJourney.jsx      # Journey creation form
    │   ├── Workspace.jsx       # Journey workspace — DocumentTree + AI chat panel
    │   ├── SectionRoadmap.jsx  # Section timeline with task cards and drawer
    │   ├── Calendar.jsx        # Month grid with due-date tasks
    │   └── Settings.jsx        # Profile editor + sign out
    │
    └── components/
        ├── Layout/
        │   └── Sidebar.jsx         # Fixed left nav — logo, routes, journey list, user profile
        ├── Dashboard/
        │   └── ProgressRing.jsx    # SVG radial progress ring
        ├── UI/
        │   ├── Toast.jsx           # Slide-in toast notifications
        │   ├── EditableTitle.jsx   # Click-to-edit inline title component
        │   └── PWAPrompt.jsx       # "Update available" / "Ready offline" bottom-left banner
        └── Workspace/
            ├── DocumentTree.jsx    # Section cards + root quick-tasks + NewSectionModal
            ├── TaskDrawer.jsx      # 520px slide-out drawer (5 tabs + CallModal)
            ├── CallModal.jsx       # WebRTC call UI with local camera preview
            └── AIChat.jsx          # AI chat panel (mock — Gemini integration pending)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone <your-repo-url>
cd pal
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Use only the **anon** key client-side. Never expose `service_role`, `secret`, or any server-side keys in the frontend.

### 3. Set up the database

In the [Supabase SQL Editor](https://supabase.com/dashboard), create a new query, paste the contents of `supabase_schema.sql`, and run it. This creates all five tables with Row Level Security policies.

> **Tip for local development:** Disable Email Confirmations in Dashboard → Authentication → Email so new accounts are active immediately after register.

### 4. Run the app

```bash
npm run dev       # Dev server with HMR → http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview the production build (PWA features active here)
npm run lint      # ESLint
```

---

## Database Schema

Five tables, all with RLS enabled:

```sql
profiles        id, username, email, designation, streak, last_streak_date
journeys        id, name, color, owner_id, created_at
nodes           id, journey_id, parent_id, type ('header'|'task'), content,
                checked, assigned_to, due_date, sort_order,
                description, diagram, attachments (jsonb)
activities      id, journey_id, username, action, timestamp
task_messages   id, task_id, user_id, username, text, timestamp
```

**RLS rules in brief:**
- `profiles` — all authenticated users can read; only own row can be updated
- `journeys` — owner has full CRUD
- `nodes` / `activities` — full CRUD for the owner of the parent journey
- `task_messages` — any authenticated user can read and insert

---

## Architectural Notes

**Flat node tree** — Sections (`type: 'header'`) and tasks (`type: 'task'`) are stored as a flat array keyed by `journey_id`. The hierarchy is expressed via `parent_id`. Trees are reconstructed at render time with no recursive DB queries needed.

**Optimistic updates** — All write actions update Zustand state synchronously first, then fire a Supabase call in the background via `.then()`. The UI never waits on the network for user interactions. If a sync fails, it logs to the console.

**`useShallow` for array selectors** — Every Zustand selector that returns a derived array (via `.filter()` or `.find()`) is wrapped with `useShallow` from `zustand/react/shallow`. Without this, the new array reference returned each render causes `useSyncExternalStore` to detect a constant state change and enters an infinite re-render loop.

**`liveActiveTask` pattern** — The `TaskDrawer` parent stores the open task's `id` in local state but reads the live node object from the store by that ID. This keeps the drawer reactive to external changes (e.g. a checkbox toggled from the roadmap list) without prop drilling.

**Tailwind color safety** — Dynamic class strings like `` `text-${color}-400` `` are purged by Tailwind's content scanner. `src/lib/colors.js` contains static lookup tables with the full class strings so they are always included in the build output.

**PWA + offline** — Workbox precaches all static assets. `navigateFallback: 'index.html'` makes React Router work correctly when navigating offline. The Zustand `persist` middleware (localStorage) acts as a read cache for project data when Supabase is unreachable.

**Session restore** — On every app load, `AppInit` calls `supabase.auth.getSession()`. If a session exists, the user is hydrated from the `profiles` table and project data is fetched. `onAuthStateChange` handles token refresh transparently.

---

## Pending / Roadmap

- [ ] Gemini API integration for the AI Co-Pilot panel (currently mocked)
- [ ] WebRTC signaling server for live multi-user calls
- [ ] Supabase Realtime subscriptions for live cross-user collaboration
- [ ] Supabase Storage for image attachments (currently stored as base64 JSONB — not suitable for large files)
- [ ] Journey member invites and shared access (currently owner-only)
- [ ] TypeScript migration
- [ ] Test suite (no test framework installed yet)

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / public key (safe for client-side use) |

# JourneyPad

A collaborative project-planning web app with a unified workspace combining a nested task document tree, section roadmaps, a context-aware AI co-pilot, and real-time team chat. Built as a Progressive Web App — installable and offline-capable.

Live: **[https://pal-ai-cham.vercel.app](https://pal-ai-cham.vercel.app)**

---

## Features

### Workspace
- **Journeys** — top-level projects, each with a color accent and progress tracking
- **Sections** — roadmap-style phases within a journey, created via a modal with a name and description
- **Tasks** — checkboxes with full detail drawers; progress rolls up to section and journey level in real time
- **Editable titles** — click-to-rename inline for journeys, sections, and tasks everywhere in the UI
- **AI Co-Pilot** — toggle a context-aware AI panel that has full visibility of your project tree

### Task Detail Drawer

Five tabs per task:

| Tab | What it does |
|---|---|
| **Notes** | Freeform notes and acceptance criteria, auto-saved on blur |
| **Diagram** | Mermaid diagram editor with Code / live Preview toggle |
| **Files** | Image attachments stored as base64 (PNG, JPG, GIF, WebP) |
| **People** | Invite collaborators via a shareable link; assign by username |
| **AI** | Task-scoped AI assistant — generate prompts, break tasks down, write plans; upload a CLAUDE.md or project description as baseline context |

### Dashboard
- Stats row: active journeys · tasks completed · completion rate % · day streak
- Insight cards: overdue tasks and tasks due this week (only shown when relevant)
- Quick actions: New Journey, Calendar, Team & Settings, Activity Log
- Journey cards with progress rings and mini progress bars
- Activity feed showing the last 50 events
- **Pal** — AI mascot with Groq-powered personality, context-aware opening lines, and floating chat panel

### Team Chat
- Per-journey group chat powered by a production-grade `chats` + `messages` schema
- Real-time updates via Supabase Realtime (`postgres_changes`)
- Cursor-based pagination — 30 messages per page, "Load older" button with scroll position restoration
- Accessible from the desktop sidebar sub-link or the mobile bottom nav

### Collaboration
- **Invite links** — shareable URL (`https://pal-ai-cham.vercel.app/journey/:id`) lets any authenticated user join a journey; they're shown a join screen and added to the workspace via the join flow
- **Assign tasks** — assign tasks to teammates by username in the People tab
- WebRTC call modal — local camera/mic preview, mute, camera toggle; peer connection requires a signaling server for multi-user sessions

### Mobile
- Responsive layout — sidebar hidden on small screens
- Fixed bottom navigation bar with: Dashboard · Calendar · New Journey (center FAB) · Chat · Settings
- Journey picker bottom sheet when the user has multiple journeys
- Safe-area insets for iPhone notch / home indicator

### Light & Dark Mode
- Full light/dark theme via CSS custom properties (`var(--bg-base)`, `var(--border)`, etc.)
- Toggled by `useThemeStore`, persisted to localStorage

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

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` (no config file needed) |
| Routing | React Router v7 |
| State | Zustand v5 with `persist` middleware (localStorage cache) |
| Backend / Auth | Supabase (PostgreSQL + Supabase Auth + Realtime) |
| AI | Groq API — `llama-3.1-8b-instant` for AI co-pilot, task AI, and mascot |
| Diagrams | Mermaid.js v11 (async API, lazy code-split by diagram type) |
| Flow Editor | ReactFlow v11 |
| Notifications | Sonner |
| Icons | Lucide React |
| Animations | GSAP + CSS keyframes |
| PWA | vite-plugin-pwa (Workbox `generateSW` strategy) |

---

## Project Structure

```
pal/
├── .env                          # Environment variables (gitignored)
├── supabase_schema.sql           # Main tables — run once in Supabase SQL Editor
├── supabase_chat_schema.sql      # Chat tables — run after supabase_schema.sql
├── vite.config.js                # Vite + Tailwind + PWA plugin config
│
├── public/
│   ├── logo.png                  # PWA app icon
│   ├── favicon.svg               # Browser tab icon
│   └── robots.txt
│
└── src/
    ├── App.jsx                   # Router, auth guards, AppInit, BottomNav
    ├── supabaseClient.js         # Single Supabase client instance
    ├── index.css                 # Tailwind import + global keyframes + light mode overrides
    │
    ├── assets/
    │   └── mascot.png            # Pal mascot image
    │
    ├── store/
    │   ├── useAuthStore.js       # Supabase Auth — register, login, logout, profile, streak
    │   ├── useProjectStore.js    # Journeys, nodes, activities, chat — optimistic + Supabase sync
    │   ├── useThemeStore.js      # Light/dark mode toggle
    │   └── useToastStore.js      # Toast notification queue
    │
    ├── lib/
    │   ├── colors.js             # Journey color system (hex values + full Tailwind class strings)
    │   ├── groqClient.js         # Groq API helper — AI co-pilot and task AI calls
    │   └── Markdown.jsx          # Lightweight in-house markdown renderer (no library)
    │
    ├── pages/
    │   ├── Landing.jsx           # Marketing landing page (guest-only)
    │   ├── Auth.jsx              # Login / Register — split layout
    │   ├── Dashboard.jsx         # Stats, journeys grid, activity feed, Pal mascot
    │   ├── NewJourney.jsx        # Journey creation form
    │   ├── Workspace.jsx         # Journey workspace — DocumentTree + AI chat panel + join gate
    │   ├── SectionRoadmap.jsx    # Section timeline with task cards and drawer
    │   ├── JourneyChat.jsx       # Per-journey group chat with real-time + pagination
    │   ├── Calendar.jsx          # Month grid with due-date tasks
    │   └── Settings.jsx          # Profile editor + theme toggle + sign out
    │
    └── components/
        ├── Layout/
        │   ├── Sidebar.jsx           # Fixed left nav — logo, routes, journey list (with Team Chat sub-links), user profile
        │   └── BottomNav.jsx         # Mobile-only fixed bottom navigation bar
        ├── Dashboard/
        │   ├── ProgressRing.jsx      # SVG radial progress ring
        │   └── MascotAvatar.jsx      # Pal mascot — floating chat panel with Groq AI
        ├── UI/
        │   ├── Toast.jsx             # Slide-in toast notifications
        │   ├── EditableTitle.jsx     # Click-to-edit inline title component
        │   └── PWAPrompt.jsx         # "Update available" / "Ready offline" bottom-left banner
        └── Workspace/
            ├── DocumentTree.jsx      # Section cards + root quick-tasks + NewSectionModal
            ├── TaskDrawer.jsx        # 520px slide-out drawer (5 tabs + AI assistant + invite links)
            ├── CallModal.jsx         # WebRTC call UI with local camera preview
            └── AIChat.jsx            # AI co-pilot panel (context-aware, full project tree)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key (free tier available)

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
VITE_GROQ_API_KEY=your-groq-api-key-here
```

> Use only the **anon** key client-side. Never expose `service_role`, `secret`, or any server-side keys in the frontend.

### 3. Set up the database

In the [Supabase SQL Editor](https://supabase.com/dashboard), run the migration files **in order**:

1. Paste and run **`supabase_schema.sql`** — creates the main tables (`profiles`, `journeys`, `nodes`, `activities`, `task_messages`) with Row Level Security policies.
2. Paste and run **`supabase_chat_schema.sql`** — creates the production chat tables (`chats`, `messages`) with indexes and Realtime publication.

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

### Main tables

```sql
profiles        id, username, email, designation, streak, last_streak_date
journeys        id, name, color, owner_id, created_at
nodes           id, journey_id, parent_id, type ('header'|'task'), content,
                checked, assigned_to, due_date, sort_order,
                description, diagram, attachments (jsonb)
activities      id, journey_id, username, action, timestamp
task_messages   id, task_id, user_id, username, text, timestamp
```

### Chat tables

```sql
chats           id, journey_id (unique), last_message, last_message_at, created_at, updated_at
messages        id, chat_id, sender_id, sender_username, content, created_at
-- Index: messages(chat_id, created_at DESC) for cursor pagination
```

**RLS rules in brief:**
- `profiles` — all authenticated users can read; only own row can be updated
- `journeys` — authenticated users can read all; owner has full CRUD
- `nodes` / `activities` — full CRUD for the owner of the parent journey
- `task_messages` / `messages` — any authenticated user can read and insert
- `chats` — any authenticated user can read and insert

---

## Architectural Notes

**Flat node tree** — Sections (`type: 'header'`) and tasks (`type: 'task'`) are stored as a flat array keyed by `journey_id`. The hierarchy is expressed via `parent_id`. Trees are reconstructed at render time with no recursive DB queries needed.

**Optimistic updates** — All write actions update Zustand state synchronously first, then fire a Supabase call in the background via `.then()`. The UI never waits on the network for user interactions.

**`useShallow` for array selectors** — Every Zustand selector that returns a derived array (via `.filter()` or `.find()`) is wrapped with `useShallow` from `zustand/react/shallow` to prevent infinite re-render loops from referential inequality.

**Cursor-based chat pagination** — Messages are loaded 30 at a time, most-recent first. "Load older" uses the oldest visible message's `created_at` as a cursor. Scroll position is restored after prepending via `scrollHeight − prevScrollHeight`.

**Real-time deduplication** — `addChatMessageFromRealtime` checks `existing.some(m => m.id === msg.id)` before inserting, so optimistic inserts and real-time events don't create duplicates.

**Invite link join flow** — `JoinJourneyGate` in Workspace fetches the journey directly from Supabase (RLS allows any authenticated user to read any journey). On "Join Journey", it calls `loadData()` which re-fetches all accessible journeys and then navigates into the workspace.

**Markdown rendering** — A lightweight in-house renderer (`src/lib/Markdown.jsx`) handles `##`, `**`, `*`, `` ` ``, `---`, bullet lists, numbered lists, blockquotes, and fenced code blocks. Raw text is shown during typing animations; `<Markdown>` replaces it instantly when animation completes.

**AI context per journey** — The task AI stores a baseline context string in `localStorage` under the key `pal-ctx-{journeyId}`. Users can upload a CLAUDE.md/text file or type a description; this is injected into every Groq system prompt for that journey.

**Tailwind color safety** — Dynamic class strings like `` `text-${color}-400` `` are purged by Tailwind's content scanner. `src/lib/colors.js` contains static lookup tables with full class strings so they are always included in the build output.

**PWA + offline** — Workbox precaches all static assets. `navigateFallback: 'index.html'` makes React Router work correctly when navigating offline. The Zustand `persist` middleware (localStorage) acts as a read cache for project data when Supabase is unreachable.

**Session restore** — On every app load, `AppInit` calls `supabase.auth.getSession()`. If a session exists, the user is hydrated from the `profiles` table and project data is fetched. `onAuthStateChange` handles token refresh transparently.

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / public key (safe for client-side use) |
| `VITE_GROQ_API_KEY` | Groq API key for AI co-pilot, task AI, and Pal mascot |

---

## Deployment

The app is deployed on **Vercel**. Set the three environment variables above in the Vercel project settings (Settings → Environment Variables) and every push to `master` deploys automatically.

Production URL: `https://pal-ai-cham.vercel.app`

---

## Roadmap

- [ ] WebRTC signaling server for live multi-user calls
- [ ] Supabase Storage for image attachments (currently base64 JSONB — not suitable for large files)
- [ ] Role-based journey access (viewer / editor / admin)
- [ ] TypeScript migration
- [ ] Test suite (no test framework installed yet)

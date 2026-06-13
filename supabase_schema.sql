-- ============================================================
-- JourneyPad — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Profiles (mirrors auth.users with app-specific fields)
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  username      text not null,
  email         text,
  designation   text default '',
  streak        int  default 0,
  last_streak_date text,
  created_at    timestamptz default now()
);

-- 2. Journeys
create table if not exists journeys (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default 'emerald',
  owner_id    uuid references auth.users on delete cascade,
  created_at  timestamptz default now()
);

-- 3. Nodes (sections + tasks, flat tree via parent_id)
create table if not exists nodes (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid references journeys on delete cascade,
  parent_id   uuid references nodes  on delete cascade,
  type        text not null check (type in ('header','task')),
  content     text not null default '',
  checked     boolean default false,
  assigned_to text,
  due_date    date,
  sort_order  int  default 0,
  description text,
  diagram     text,
  attachments jsonb default '[]',
  created_at  timestamptz default now()
);

-- 4. Activities
create table if not exists activities (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid references journeys on delete cascade,
  username    text,
  action      text,
  timestamp   timestamptz default now()
);

-- 5. Task messages (per-task chat)
create table if not exists task_messages (
  id        uuid primary key default gen_random_uuid(),
  task_id   uuid references nodes on delete cascade,
  user_id   uuid references auth.users on delete set null,
  username  text,
  text      text not null,
  timestamp timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles     enable row level security;
alter table journeys     enable row level security;
alter table nodes        enable row level security;
alter table activities   enable row level security;
alter table task_messages enable row level security;

-- profiles: authenticated users can read all, only update own
create policy "profiles_select" on profiles
  for select to authenticated using (true);
create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles
  for update using (auth.uid() = id);

-- journeys: owner full access
create policy "journeys_all" on journeys
  for all using (auth.uid() = owner_id);

-- nodes: owner of parent journey full access
create policy "nodes_all" on nodes
  for all using (
    exists (
      select 1 from journeys
      where journeys.id = nodes.journey_id
        and journeys.owner_id = auth.uid()
    )
  );

-- activities: owner of parent journey full access
create policy "activities_all" on activities
  for all using (
    exists (
      select 1 from journeys
      where journeys.id = activities.journey_id
        and journeys.owner_id = auth.uid()
    )
  );

-- task_messages: any authenticated user can read/insert
create policy "task_messages_select" on task_messages
  for select to authenticated using (true);
create policy "task_messages_insert" on task_messages
  for insert to authenticated with check (auth.uid() = user_id);

-- ============================================================
-- Realtime (enable for live collaboration)
-- ============================================================
-- Run these if you want live updates across browser tabs:
-- alter publication supabase_realtime add table journeys;
-- alter publication supabase_realtime add table nodes;
-- alter publication supabase_realtime add table activities;
-- alter publication supabase_realtime add table task_messages;

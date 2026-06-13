-- Migration: Journey-level team chat
-- Run this in Supabase Dashboard → SQL Editor → New query

create table if not exists journey_messages (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid references journeys on delete cascade,
  user_id     uuid references auth.users on delete set null,
  username    text,
  text        text not null,
  timestamp   timestamptz default now()
);

alter table journey_messages enable row level security;

-- Any authenticated user can read journey messages
create policy "journey_messages_select" on journey_messages
  for select to authenticated using (true);

-- Authenticated users can insert their own messages
create policy "journey_messages_insert" on journey_messages
  for insert to authenticated with check (auth.uid() = user_id);

-- Optional: enable Realtime for live updates across browser tabs
-- alter publication supabase_realtime add table journey_messages;

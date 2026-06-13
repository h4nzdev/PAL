-- ============================================================
-- JourneyPad — Team / Members schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists journey_members (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid references journeys on delete cascade not null,
  user_id     uuid references auth.users on delete cascade not null,
  username    text not null,
  role        text not null default 'viewer'
              check (role in ('owner', 'editor', 'uploader', 'viewer')),
  joined_at   timestamptz default now(),
  unique (journey_id, user_id)
);

alter table journey_members enable row level security;

-- Any authenticated user can see who is in a journey
create policy "members_select" on journey_members
  for select to authenticated using (true);

-- Users can insert only themselves
create policy "members_insert" on journey_members
  for insert to authenticated with check (auth.uid() = user_id);

-- Only the journey owner can update roles
create policy "members_update" on journey_members
  for update to authenticated using (
    exists (
      select 1 from journeys
      where journeys.id = journey_members.journey_id
        and journeys.owner_id = auth.uid()
    )
  );

-- Owner can remove anyone; members can remove themselves (leave)
create policy "members_delete" on journey_members
  for delete to authenticated using (
    auth.uid() = user_id
    or exists (
      select 1 from journeys
      where journeys.id = journey_members.journey_id
        and journeys.owner_id = auth.uid()
    )
  );

-- ============================================================
-- JourneyPad — Invite system RLS fix
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- This fixes the invite flow by allowing any authenticated
-- user to READ journeys/nodes (needed to join via code).
-- Write access (insert/update/delete) stays owner-only.
-- ============================================================

-- Drop old catch-all policies
drop policy if exists "journeys_all"   on journeys;
drop policy if exists "nodes_all"      on nodes;
drop policy if exists "activities_all" on activities;

-- ── Journeys ──────────────────────────────────────────────────────────────────
-- Any authenticated user can read any journey (needed for join-by-code lookup)
create policy "journeys_select" on journeys
  for select to authenticated using (true);

-- Only the owner can create / modify / delete
create policy "journeys_insert" on journeys
  for insert to authenticated with check (auth.uid() = owner_id);

create policy "journeys_update" on journeys
  for update to authenticated using (auth.uid() = owner_id);

create policy "journeys_delete" on journeys
  for delete to authenticated using (auth.uid() = owner_id);

-- ── Nodes ─────────────────────────────────────────────────────────────────────
-- Any authenticated user can read nodes (needed to view a joined journey)
create policy "nodes_select" on nodes
  for select to authenticated using (true);

-- Only the journey owner can write nodes
create policy "nodes_insert" on nodes
  for insert to authenticated with check (
    exists (select 1 from journeys where journeys.id = nodes.journey_id and journeys.owner_id = auth.uid())
  );

create policy "nodes_update" on nodes
  for update to authenticated using (
    exists (select 1 from journeys where journeys.id = nodes.journey_id and journeys.owner_id = auth.uid())
  );

create policy "nodes_delete" on nodes
  for delete to authenticated using (
    exists (select 1 from journeys where journeys.id = nodes.journey_id and journeys.owner_id = auth.uid())
  );

-- ── Activities ────────────────────────────────────────────────────────────────
create policy "activities_select" on activities
  for select to authenticated using (true);

create policy "activities_insert" on activities
  for insert to authenticated with check (
    exists (select 1 from journeys where journeys.id = activities.journey_id and journeys.owner_id = auth.uid())
  );

create policy "activities_delete" on activities
  for delete to authenticated using (
    exists (select 1 from journeys where journeys.id = activities.journey_id and journeys.owner_id = auth.uid())
  );

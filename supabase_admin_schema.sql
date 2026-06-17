-- ══════════════════════════════════════════════════════════════
-- PAL — Admin Monitoring Panel Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- After running, bootstrap your admin:
--   insert into admin_users (id) values ('<your-auth-user-uuid>');
-- ══════════════════════════════════════════════════════════════

-- ── 1. Admin identity ─────────────────────────────────────────
create table if not exists admin_users (
  id         uuid primary key references auth.users on delete cascade,
  created_at timestamptz default now()
);

-- ── 2. AI API usage (per user per calendar day) ───────────────
create table if not exists ai_usage (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date    date not null default current_date,
  count   int  not null default 0,
  unique (user_id, date)
);

-- ── 3. Force logout flag table (detected via Realtime) ────────
create table if not exists force_logout_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  requested_at timestamptz default now()
);

-- ── 4. Client performance metrics (browser-reported) ──────────
create table if not exists client_metrics (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  reported_at      timestamptz default now(),
  js_heap_used     bigint,
  js_heap_total    bigint,
  page_load_ms     int,
  sync_queue_depth int
);

-- ── 5. Ban flag on profiles ───────────────────────────────────
alter table profiles add column if not exists is_banned boolean default false;

-- ══════════════════════════════════════════════════════════════
-- Helper functions
-- ══════════════════════════════════════════════════════════════

-- is_admin(): SECURITY DEFINER bypasses RLS on admin_users.
-- Used as a predicate in every admin-facing policy.
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from admin_users where id = auth.uid())
$$;
grant execute on function is_admin() to authenticated;

-- increment_ai_usage(): atomic upsert-and-increment to avoid
-- read-modify-write races from the client.
create or replace function increment_ai_usage(p_user_id uuid, p_date date)
returns void language plpgsql security definer as $$
begin
  insert into ai_usage (user_id, date, count)
  values (p_user_id, p_date, 1)
  on conflict (user_id, date)
  do update set count = ai_usage.count + 1;
end;
$$;
grant execute on function increment_ai_usage(uuid, date) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════════════════

alter table admin_users           enable row level security;
alter table ai_usage              enable row level security;
alter table force_logout_requests enable row level security;
alter table client_metrics        enable row level security;

-- admin_users: each user can only read their own row (to check if they're admin)
create policy "au_select_own"
  on admin_users for select
  using (id = auth.uid());

-- ai_usage: users manage their own rows; admins can read all
create policy "aiu_own"
  on ai_usage for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "aiu_admin_read"
  on ai_usage for select
  using (is_admin());

-- force_logout_requests: admins insert; target user can select + delete (to act on it)
create policy "flr_user_select"
  on force_logout_requests for select
  using (user_id = auth.uid());

create policy "flr_user_delete"
  on force_logout_requests for delete
  using (user_id = auth.uid());

create policy "flr_admin_insert"
  on force_logout_requests for insert
  with check (is_admin());

create policy "flr_admin_delete"
  on force_logout_requests for delete
  using (is_admin());

-- client_metrics: users insert their own; admins read all
create policy "cm_user_insert"
  on client_metrics for insert
  with check (user_id = auth.uid());

create policy "cm_admin_read"
  on client_metrics for select
  using (is_admin());

-- profiles: admin can update any row (for ban/unban)
create policy "profiles_admin_update"
  on profiles for update
  using (is_admin());

-- journeys / nodes / activities: admin read-all stacks with existing owner policies
create policy "journeys_admin_read"
  on journeys for select
  using (is_admin());

create policy "nodes_admin_read"
  on nodes for select
  using (is_admin());

create policy "activities_admin_read"
  on activities for select
  using (is_admin());

-- ── Table grants ──────────────────────────────────────────────
grant select, insert, update, delete on admin_users           to authenticated;
grant select, insert, update, delete on ai_usage              to authenticated;
grant select, insert, delete         on force_logout_requests to authenticated;
grant select, insert                 on client_metrics         to authenticated;

-- ── Enable Realtime on force_logout_requests ──────────────────
alter publication supabase_realtime add table force_logout_requests;

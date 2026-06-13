-- Production chat schema following Context.md design

-- chats: one row per journey (created lazily on first message)
create table if not exists chats (
  id              uuid primary key default gen_random_uuid(),
  journey_id      uuid references journeys on delete cascade unique not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  last_message    text,
  last_message_at timestamptz
);

-- messages: the only table that grows; keep it lean
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  chat_id         uuid references chats on delete cascade not null,
  sender_id       uuid references auth.users on delete set null,
  sender_username text,
  content         text not null,
  created_at      timestamptz default now()
);

-- Fast cursor-based pagination (most recent first per chat)
create index if not exists idx_messages_chat_created
  on messages(chat_id, created_at desc);

-- RLS
alter table chats    enable row level security;
alter table messages enable row level security;

create policy "chats_select"   on chats    for select to authenticated using (true);
create policy "chats_insert"   on chats    for insert to authenticated with check (true);
create policy "chats_update"   on chats    for update to authenticated using (true);
create policy "messages_select" on messages for select to authenticated using (true);
create policy "messages_insert" on messages for insert to authenticated
  with check (auth.uid() = sender_id);

-- Enable real-time (run once per project; safe to re-run)
alter publication supabase_realtime add table messages;

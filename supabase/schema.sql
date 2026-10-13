-- BorderTime 数据库结构。在 Supabase 的 SQL Editor 中运行一次即可。

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  airport_code text not null check (airport_code ~ '^[A-Z]{3}$'),
  direction text not null check (direction in ('departure','arrival')),
  wait_minutes integer check (wait_minutes between 1 and 360),
  queue_minutes integer check (queue_minutes between 0 and 360),
  processing_minutes integer check (processing_minutes between 0 and 360),
  crowd text check (crowd in ('light','moderate','heavy')),
  created_at timestamptz not null default now(),
  check (wait_minutes is not null or crowd is not null)
);

alter table public.reports enable row level security;

revoke all on public.reports from anon, authenticated;
grant select on public.reports to anon, authenticated;
grant insert (airport_code, direction, wait_minutes, queue_minutes, processing_minutes, crowd)
  on public.reports to anon, authenticated;

create policy "anyone can read reports" on public.reports
  for select to anon, authenticated using (true);
create policy "anyone can add reports" on public.reports
  for insert to anon, authenticated with check (true);

create index reports_lookup_idx
  on public.reports (airport_code, direction, created_at desc);

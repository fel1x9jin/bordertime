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

-- ---------------------------------------------------------------
-- 防刷：同一个网络 10 分钟内最多提交 6 条报告。
-- 只保存「盐 + 网络地址」的 md5 摘要，无法还原；超过 24 小时自动删除。
-- private 这个 schema 不对网页公开，访客读不到这些表。
-- ---------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.report_attempts (
  id bigint generated always as identity primary key,
  client_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists report_attempts_lookup_idx
  on private.report_attempts (client_hash, created_at desc);
create index if not exists report_attempts_created_idx
  on private.report_attempts (created_at);
revoke all on private.report_attempts from anon, authenticated;

create table if not exists private.rate_salt (
  id boolean primary key default true check (id),
  salt text not null default gen_random_uuid()::text
);
insert into private.rate_salt (id) values (true) on conflict do nothing;
revoke all on private.rate_salt from anon, authenticated;

create or replace function private.limit_report_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_headers json;
  v_ip text;
  v_salt text;
  v_hash text;
  v_count integer;
begin
  v_headers := nullif(current_setting('request.headers', true), '')::json;
  v_ip := trim(split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1));
  if v_ip = '' then
    v_ip := 'unknown';
  end if;

  select salt into v_salt from private.rate_salt where id;
  v_hash := md5(v_salt || v_ip);

  -- 顺手清理 24 小时前的记录
  delete from private.report_attempts where created_at < now() - interval '1 day';

  select count(*) into v_count
  from private.report_attempts
  where client_hash = v_hash
    and created_at > now() - interval '10 minutes';

  if v_count >= 6 then
    raise exception 'rate_limited';
  end if;

  insert into private.report_attempts (client_hash) values (v_hash);
  return new;
end;
$$;

revoke all on function private.limit_report_rate() from public, anon, authenticated;

drop trigger if exists limit_report_rate_trigger on public.reports;
create trigger limit_report_rate_trigger
  before insert on public.reports
  for each row execute function private.limit_report_rate();

-- BorderTime 现场动态。在 Supabase SQL Editor 中整段运行一次即可。
-- 只新增 public.airport_updates、private 里单独的限流，以及存储桶 airport-media。
-- 不会修改 public.reports、它的 RLS / 授权，也不会改 private.limit_report_rate()。
-- 可以重复运行：已有对象会跳过或按同样的定义重建。整段在一个事务里。
--
-- 隐藏一条动态（访客没有更新权限，请在 SQL Editor 里执行）：
--   update public.airport_updates set is_hidden = true where id = '...';
-- 公开链接在知道路径时仍可打开文件。若要彻底下线，再在 Storage 里删除
-- airport-media 桶中对应的对象。

begin;

create schema if not exists private;
revoke all on schema private from anon, authenticated;

-- 与排队报告共用同一把盐；不存在时才创建，已有的盐不会被换掉。
create table if not exists private.rate_salt (
  id boolean primary key default true check (id),
  salt text not null default gen_random_uuid()::text
);
insert into private.rate_salt (id) values (true) on conflict do nothing;
revoke all on private.rate_salt from anon, authenticated;

create table if not exists private.airport_update_attempts (
  id bigint generated always as identity primary key,
  client_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists airport_update_attempts_lookup_idx
  on private.airport_update_attempts (client_hash, created_at desc);
create index if not exists airport_update_attempts_created_idx
  on private.airport_update_attempts (created_at);
revoke all on private.airport_update_attempts from anon, authenticated;
alter table private.airport_update_attempts enable row level security;

-- 同一个网络 10 分钟内最多 5 条现场动态。
-- 只保存「盐 + 网络地址」的 md5，无法还原；超过 24 小时的记录顺手删掉。
-- 计数和 public.reports 分开，互不影响。
create or replace function private.limit_airport_update_rate()
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

  delete from private.airport_update_attempts
  where created_at < now() - interval '1 day';

  select count(*) into v_count
  from private.airport_update_attempts
  where client_hash = v_hash
    and created_at > now() - interval '10 minutes';

  if v_count >= 5 then
    raise exception 'rate_limited';
  end if;

  insert into private.airport_update_attempts (client_hash) values (v_hash);
  return new;
end;
$$;

revoke all on function private.limit_airport_update_rate() from public, anon, authenticated;

create table if not exists public.airport_updates (
  id uuid primary key default gen_random_uuid(),
  airport_id text not null,
  body text,
  media_path text,
  media_type text,
  nickname text,
  created_at timestamptz not null default now(),
  is_hidden boolean not null default false,
  -- 与 src/data/airports.ts 的 code 保持一致。新增机场时两边一起改。
  constraint airport_updates_airport_id_check check (
    airport_id in (
      'BCN', 'MAD', 'LHR', 'CDG', 'AMS', 'FRA', 'MUC', 'FCO', 'MXP', 'LIS',
      'ZRH', 'IST', 'DXB', 'DOH', 'JED', 'RUH', 'JFK', 'LAX', 'SFO', 'ORD',
      'YVR', 'SIN', 'BKK', 'KUL', 'HKG', 'NRT', 'ICN',
      'PVG', 'PEK', 'CAN', 'SZX', 'TFU', 'CKG', 'HGH', 'SYD', 'MEL'
    )
  ),
  constraint airport_updates_body_check check (
    body is null
    or (char_length(btrim(body)) >= 1 and char_length(body) between 1 and 280)
  ),
  constraint airport_updates_nickname_check check (
    nickname is null or char_length(nickname) <= 30
  ),
  constraint airport_updates_media_type_check check (
    media_type is null or media_type in ('image', 'video')
  ),
  constraint airport_updates_media_shape_check check (
    (
      media_path is null
      and media_type is null
    )
    or (
      media_type = 'image'
      and split_part(media_path, '/', 1) = airport_id
      and media_path ~ '^[A-Z]{3}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|heic)$'
    )
    or (
      media_type = 'video'
      and split_part(media_path, '/', 1) = airport_id
      and media_path ~ '^[A-Z]{3}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|mov|webm)$'
    )
  ),
  constraint airport_updates_has_content_check check (
    body is not null or media_path is not null
  )
);

create index if not exists airport_updates_airport_created_idx
  on public.airport_updates (airport_id, created_at desc);

-- 首页一次取出所有机场近几小时的动态；部分索引跟「只公开未隐藏」的策略一致。
create index if not exists airport_updates_recent_idx
  on public.airport_updates (created_at desc)
  where is_hidden = false;

revoke all on public.airport_updates from public, anon, authenticated;
grant select (id, airport_id, body, media_path, media_type, nickname, created_at)
  on public.airport_updates to anon, authenticated;
grant insert (airport_id, body, media_path, media_type, nickname)
  on public.airport_updates to anon, authenticated;

alter table public.airport_updates enable row level security;

drop policy if exists airport_updates_select_visible on public.airport_updates;
create policy airport_updates_select_visible
  on public.airport_updates
  for select
  to anon, authenticated
  using (is_hidden = false);

drop policy if exists airport_updates_insert_visible on public.airport_updates;
create policy airport_updates_insert_visible
  on public.airport_updates
  for insert
  to anon, authenticated
  with check (is_hidden = false);

drop trigger if exists limit_airport_update_rate_trigger on public.airport_updates;
create trigger limit_airport_update_rate_trigger
  before insert on public.airport_updates
  for each row execute function private.limit_airport_update_rate();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'airport-media',
  'airport-media',
  true,
  20971520, -- 20 MiB
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  "public" = excluded."public",
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists airport_media_public_read on storage.objects;
create policy airport_media_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'airport-media');

drop policy if exists airport_media_anon_insert on storage.objects;
create policy airport_media_anon_insert
  on storage.objects
  for insert
  to anon
  with check (
    bucket_id = 'airport-media'
    and (storage.foldername(name))[1] in (
      'BCN', 'MAD', 'LHR', 'CDG', 'AMS', 'FRA', 'MUC', 'FCO', 'MXP', 'LIS',
      'ZRH', 'IST', 'DXB', 'DOH', 'JED', 'RUH', 'JFK', 'LAX', 'SFO', 'ORD',
      'YVR', 'SIN', 'BKK', 'KUL', 'HKG', 'NRT', 'ICN',
      'PVG', 'PEK', 'CAN', 'SZX', 'TFU', 'CKG', 'HGH', 'SYD', 'MEL'
    )
  );

commit;

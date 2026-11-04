-- 已上线的库：放宽现场动态允许的机场代码。
-- 新增 JED、RUH。应用不再展示 XIY，但约束里保留它，
-- 这样已经写下的西安现场动态仍然合法。
-- 不读取、不修改、不删除 public.reports。

begin;

do $$
begin
  if to_regclass('public.airport_updates') is null then
    return;
  end if;

  alter table public.airport_updates
    drop constraint if exists airport_updates_airport_id_check;

  alter table public.airport_updates
    add constraint airport_updates_airport_id_check
    check (
      airport_id in (
        'BCN', 'MAD', 'LHR', 'CDG', 'AMS', 'FRA', 'MUC', 'FCO', 'MXP', 'LIS',
        'ZRH', 'IST', 'DXB', 'DOH', 'JED', 'RUH', 'JFK', 'LAX', 'SFO', 'ORD',
        'YVR', 'SIN', 'BKK', 'KUL', 'HKG', 'NRT', 'ICN',
        'PVG', 'PEK', 'CAN', 'SZX', 'TFU', 'CKG', 'HGH', 'SYD', 'MEL',
        'XIY'
      )
    );
end $$;

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

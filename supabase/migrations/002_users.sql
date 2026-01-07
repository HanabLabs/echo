-- ===============================================
-- ECHO - ユーザプロファイルテーブル追加
-- ===============================================

-- ユーザプロファイル
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  partner_name text not null,
  partner_icon text not null default 'cat',
  theme text not null default 'soft',
  twitter_access_token text,
  twitter_refresh_token text,
  twitter_user_id text,
  thought_log_count_short integer not null default 0,
  thought_log_count_long integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ユーザプロファイルのRLS
alter table user_profiles enable row level security;

create policy "select own profile"
on user_profiles for select
using (id = auth.uid());

create policy "update own profile"
on user_profiles for update
using (id = auth.uid());

create policy "insert own profile"
on user_profiles for insert
with check (id = auth.uid());

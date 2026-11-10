-- 회원가입 사용자의 프로필 정보를 관리하는 public.profiles 테이블 생성
-- auth.users와 1:1로 연결되며, 사용자 삭제 시 프로필도 함께 삭제된다.

-- 1. 프로필 테이블 -------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique,
  full_name   text,
  avatar_url  text,
  website     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint username_length check (username is null or char_length(username) between 3 and 30),
  constraint username_format check (username is null or username ~ '^[a-z0-9_]+$')
);

comment on table public.profiles is '회원가입 사용자의 공개 프로필 정보';

-- 2. updated_at 자동 갱신 트리거 --------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 3. 회원가입 시 프로필 자동 생성 트리거 -----------------------------------
-- signUp의 options.data(raw_user_meta_data)에서 값을 가져와 프로필을 만든다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 트리거 전용 함수이므로 API(RPC)로 직접 호출하지 못하도록 실행 권한을 회수
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 트리거 생성 이전에 가입한 기존 사용자에게 프로필 백필
insert into public.profiles (id, username, full_name, avatar_url)
select u.id,
       lower(u.raw_user_meta_data ->> 'username'),
       u.raw_user_meta_data ->> 'full_name',
       u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

-- 4. Row Level Security -----------------------------------------------------
alter table public.profiles enable row level security;

-- 본인 프로필만 조회 가능
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- 본인 프로필만 수정 가능
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 트리거 외에 직접 생성하는 경우(누락 복구용)에도 본인 행만 허용
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- 본인 프로필 삭제는 허용하지 않는다 (삭제는 auth.users 삭제를 통해서만 수행)

-- 5. 권한 ----------------------------------------------------------------
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

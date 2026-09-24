-- أكاديمية صرح — ترقية الصفحات الإنتاجية (المرحلة الثانية)
-- شغّل الملف مرة واحدة في Supabase SQL Editor بعد schema.sql.

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  instructor text not null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check(duration_minutes > 0),
  meeting_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  certificate_no text unique not null default ('SRH-CERT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  issued_at timestamptz not null default now(),
  file_url text,
  unique(user_id,course_id)
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings(key,value)
values('general','{"academy_name":"أكاديمية صرح","support_email":"info@sarh-academy.com","support_phone":"","allow_requests":true}'::jsonb)
on conflict(key) do nothing;

alter table public.live_sessions enable row level security;
alter table public.certificates enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "sessions_authenticated_read" on public.live_sessions;
create policy "sessions_authenticated_read" on public.live_sessions for select to authenticated using(published or public.is_admin());
drop policy if exists "sessions_admin_all" on public.live_sessions;
create policy "sessions_admin_all" on public.live_sessions for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "certificates_read_own_or_admin" on public.certificates;
create policy "certificates_read_own_or_admin" on public.certificates for select to authenticated using(user_id=auth.uid() or public.is_admin());
drop policy if exists "certificates_admin_all" on public.certificates;
create policy "certificates_admin_all" on public.certificates for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "settings_authenticated_read" on public.platform_settings;
create policy "settings_authenticated_read" on public.platform_settings for select to authenticated using(true);
drop policy if exists "settings_admin_all" on public.platform_settings;
create policy "settings_admin_all" on public.platform_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop trigger if exists sessions_touch_updated_at on public.live_sessions;
create trigger sessions_touch_updated_at before update on public.live_sessions for each row execute function public.touch_updated_at();

create or replace function public.update_my_profile(p_full_name text,p_phone text)
returns public.profiles language plpgsql security definer set search_path=public as $$
declare result public.profiles;
begin
  if auth.uid() is null then raise exception 'غير مصرح'; end if;
  if char_length(trim(p_full_name))<3 then raise exception 'الاسم غير صالح'; end if;
  update public.profiles set full_name=trim(p_full_name),phone=nullif(trim(p_phone),'') where id=auth.uid() returning * into result;
  return result;
end; $$;
revoke all on function public.update_my_profile(text,text) from public;
grant execute on function public.update_my_profile(text,text) to authenticated;

create or replace function public.recalculate_course_progress()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_user uuid; v_course uuid; v_total int; v_done int; v_progress numeric(5,2);
begin
  if TG_OP='DELETE' then v_user=old.user_id; select l.course_id into v_course from public.lessons l where l.id=old.lesson_id;
  else v_user=new.user_id; select l.course_id into v_course from public.lessons l where l.id=new.lesson_id; end if;
  select count(*) into v_total from public.lessons where course_id=v_course and published=true;
  select count(*) into v_done from public.lesson_progress lp join public.lessons l on l.id=lp.lesson_id where lp.user_id=v_user and l.course_id=v_course and l.published=true and lp.completed=true;
  v_progress=case when v_total=0 then 0 else round((v_done::numeric/v_total::numeric)*100,2) end;
  update public.enrollments set progress=v_progress,completed_at=case when v_progress>=100 then coalesce(completed_at,now()) else null end where user_id=v_user and course_id=v_course;
  if v_progress>=100 then
    insert into public.certificates(user_id,course_id) values(v_user,v_course) on conflict(user_id,course_id) do nothing;
  end if;
  if TG_OP='DELETE' then return old; else return new; end if;
end; $$;

drop trigger if exists lesson_progress_recalculate on public.lesson_progress;
create trigger lesson_progress_recalculate after insert or update or delete on public.lesson_progress for each row execute function public.recalculate_course_progress();

-- التأكد من أن المتدرب يستطيع تحديث تقدمه أو حذفه عند الحاجة
drop policy if exists "progress_delete_own" on public.lesson_progress;
create policy "progress_delete_own" on public.lesson_progress for delete to authenticated using(user_id=auth.uid());

grant select on public.live_sessions,public.certificates,public.platform_settings to authenticated;
grant insert,update,delete on public.live_sessions,public.certificates,public.platform_settings to authenticated;
grant update on public.profiles to authenticated;

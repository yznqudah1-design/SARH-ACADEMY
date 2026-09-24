-- أكاديمية صرح — مخطط قاعدة البيانات الإنتاجية
-- شغّل هذا الملف كاملاً مرة واحدة داخل Supabase SQL Editor.

create extension if not exists pgcrypto;
create extension if not exists citext;

DO $$ BEGIN
  create type public.user_role as enum ('student','admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create type public.user_status as enum ('pending','active','suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create type public.request_status as enum ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

create sequence if not exists public.enrollment_request_seq start 1001;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique not null,
  full_name text not null,
  contact_email citext,
  phone text,
  role public.user_role not null default 'student',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug citext unique not null,
  title text not null,
  description text,
  category text,
  level text,
  duration_hours integer not null default 0 check (duration_hours >= 0),
  lessons_count integer not null default 0 check (lessons_count >= 0),
  cover_url text,
  intro_video_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  reference_id text unique not null default ('SRH-' || to_char(now(),'YYMM') || '-' || lpad(nextval('public.enrollment_request_seq')::text,4,'0')),
  full_name text not null check (char_length(full_name) between 3 and 120),
  email citext not null,
  phone text not null,
  specialty text not null,
  course_id uuid references public.courses(id) on delete set null,
  course_title text not null,
  status public.request_status not null default 'pending',
  generated_username citext,
  rejection_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enrollment_requests_status_idx on public.enrollment_requests(status,created_at desc);
create index if not exists enrollment_requests_email_idx on public.enrollment_requests(email);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id,course_id)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  position integer not null check (position > 0),
  duration_minutes integer not null default 0,
  is_preview boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique(course_id,position)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key(user_id,lesson_id)
);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists courses_touch_updated_at on public.courses;
create trigger courses_touch_updated_at before update on public.courses for each row execute function public.touch_updated_at();
drop trigger if exists requests_touch_updated_at on public.enrollment_requests;
create trigger requests_touch_updated_at before update on public.enrollment_requests for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,username,full_name,contact_email,phone,role,status)
  values(
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username',''),split_part(new.email,'@',1)),
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'مستخدم صرح'),
    nullif(new.raw_user_meta_data->>'contact_email',''),
    nullif(new.raw_user_meta_data->>'phone',''),
    'student','active'
  ) on conflict(id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and status='active');
$$;

create or replace function public.submit_enrollment_request(
  p_full_name text,p_email text,p_phone text,p_specialty text,p_course_title text
) returns table(reference_id text)
language plpgsql security definer set search_path=public as $$
declare v_reference text; v_course_id uuid;
begin
  if char_length(trim(p_full_name))<3 then raise exception 'الاسم الكامل غير صالح'; end if;
  if position('@' in p_email)<2 then raise exception 'البريد الإلكتروني غير صالح'; end if;
  if char_length(trim(p_phone))<7 then raise exception 'رقم الهاتف غير صالح'; end if;
  if char_length(trim(p_course_title))<3 then raise exception 'يرجى اختيار الدورة'; end if;
  if exists(select 1 from public.enrollment_requests where lower(email)=lower(trim(p_email)) and status='pending' and created_at>now()-interval '24 hours') then
    raise exception 'يوجد طلب قيد المراجعة بهذا البريد الإلكتروني';
  end if;
  select id into v_course_id from public.courses where title=trim(p_course_title) and published=true limit 1;
  if v_course_id is null then raise exception 'الدورة المختارة غير متاحة حالياً'; end if;
  insert into public.enrollment_requests(full_name,email,phone,specialty,course_id,course_title)
  values(trim(p_full_name),lower(trim(p_email)),trim(p_phone),trim(p_specialty),v_course_id,trim(p_course_title))
  returning enrollment_requests.reference_id into v_reference;
  return query select v_reference;
end; $$;

revoke all on function public.submit_enrollment_request(text,text,text,text,text) from public;
grant execute on function public.submit_enrollment_request(text,text,text,text,text) to anon,authenticated;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollment_requests enable row level security;
alter table public.enrollments enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.admin_audit_log enable row level security;

-- إعادة إنشاء السياسات بأمان
DO $$ DECLARE r record; BEGIN
  for r in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in ('profiles','courses','enrollment_requests','enrollments','lessons','lesson_progress','admin_audit_log') loop
    execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename);
  end loop;
END $$;

create policy "profiles_read_self_or_admin" on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
create policy "courses_public_read" on public.courses for select to anon,authenticated using (published or public.is_admin());
create policy "courses_admin_all" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "requests_admin_read" on public.enrollment_requests for select to authenticated using (public.is_admin());
create policy "requests_admin_update" on public.enrollment_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "enrollments_read_self_or_admin" on public.enrollments for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "enrollments_admin_all" on public.enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "lessons_read_enrolled" on public.lessons for select to authenticated using (published and (is_preview or exists(select 1 from public.enrollments e where e.course_id=lessons.course_id and e.user_id=auth.uid()) or public.is_admin()));
create policy "lessons_admin_all" on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "progress_read_own_or_admin" on public.lesson_progress for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "progress_insert_own" on public.lesson_progress for insert to authenticated with check (user_id=auth.uid());
create policy "progress_update_own" on public.lesson_progress for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "audit_admin_read" on public.admin_audit_log for select to authenticated using (public.is_admin());

-- بيانات الدورات الأولية
insert into public.courses(slug,title,description,category,level,duration_hours,lessons_count,published)
values
 ('autocad','AutoCAD من الصفر إلى الاحتراف','الرسم الهندسي والمخططات التنفيذية','التصميم الهندسي','مبتدئ إلى متقدم',18,25,true),
 ('primavera-p6','Primavera P6 لإدارة المشاريع','تخطيط وجدولة ومراقبة المشاريع','إدارة المشاريع','متوسط',16,21,true),
 ('quantity-surveying','حساب الكميات وحصر الأعمال','الحصر وإعداد جداول الكميات والتسعير','المكتب الفني','جميع المستويات',14,19,true),
 ('revit-bim','Revit BIM للمهندسين','نمذجة معلومات البناء وإنتاج المخططات','التصميم الهندسي','متوسط',22,28,true),
 ('excel-engineers','Excel المتقدم للمهندسين','تحليل البيانات والتقارير الهندسية','المكتب الفني','مبتدئ إلى متقدم',12,17,true),
 ('civil-3d','Civil 3D لتصميم الطرق','تصميم الطرق والأسطح والمحاور','التصميم المدني','متقدم',20,24,true)
on conflict(slug) do update set title=excluded.title,description=excluded.description,category=excluded.category,level=excluded.level,duration_hours=excluded.duration_hours,lessons_count=excluded.lessons_count;

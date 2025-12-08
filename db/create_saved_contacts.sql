-- Run this on your Supabase DB (or include in your migrations)
create table if not exists public.saved_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  domain text,
  email text not null,
  first_name text,
  last_name text,
  source text,
  created_at timestamptz default now()
);

grant select, insert, delete on public.saved_contacts to authenticated;

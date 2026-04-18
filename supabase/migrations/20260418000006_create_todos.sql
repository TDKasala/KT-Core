-- Migration: Create todos table for the getting started example

CREATE TABLE public.todos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_completed boolean default false,
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Simple policy for the demo: Users can manage their own todos
CREATE POLICY "Users can manage their own todos" 
ON public.todos 
FOR ALL 
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- Insert some seed data if you want, but we'll leave it empty for the user to add via UI

-- Migration: Create memberships table and establish RLS

CREATE TABLE public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  role text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Allow users to see memberships where user_id = auth.uid()
CREATE POLICY "Users can see their own memberships" 
ON public.memberships 
FOR SELECT 
USING ( user_id = auth.uid() );

-- Additionally adding INSERT policy so the frontend helper can execute successfully
CREATE POLICY "Users can insert their own memberships" 
ON public.memberships 
FOR INSERT 
WITH CHECK ( user_id = auth.uid() );

-- Migration: Create branches table and establish RLS

CREATE TABLE public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Allow users to perform all operations (SELECT, INSERT, UPDATE, DELETE) 
-- on branches if they belong to the organization
CREATE POLICY "Users can manage branches if they belong to the org" 
ON public.branches 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.memberships
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.memberships
    WHERE user_id = auth.uid()
  )
);

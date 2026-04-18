-- Migration: Create organizations table and establish RLS

CREATE TABLE public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text,
  type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create organizations
CREATE POLICY "Users can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK ( auth.uid() IS NOT NULL );

-- Allow users to view organizations they belong to
-- Note: This relies on a `memberships` table which will be added in a subsequent migration.
-- Assumes the `memberships` table will have `organization_id` and `user_id` columns.
CREATE POLICY "Users can view their organizations" 
ON public.organizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.memberships 
    WHERE memberships.organization_id = organizations.id 
      AND memberships.user_id = auth.uid()
  )
);

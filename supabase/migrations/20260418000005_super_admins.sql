-- Migration: Create super_admins table and establish global RLS overrides

CREATE TABLE public.super_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Allow super admins to read their own record (to check if they are an admin)
CREATE POLICY "Super admins can read own record" 
ON public.super_admins 
FOR SELECT 
USING ( id = auth.uid() );

-- Additive Policy: Super admins can see ALL organizations
CREATE POLICY "Super admins can see all orgs" 
ON public.organizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.super_admins 
    WHERE id = auth.uid()
  )
);

-- Additive Policy: Super admins can manage ALL organization_products globally
CREATE POLICY "Super admins manage all org products" 
ON public.organization_products 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.super_admins 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.super_admins 
    WHERE id = auth.uid()
  )
);

-- Migration: Create products and organization_products tables, seed data, and establish RLS

-- 1. Create products catalog
CREATE TABLE public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create organization_products to link products to organizations
CREATE TABLE public.organization_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(organization_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_products ENABLE ROW LEVEL SECURITY;

-- Policy for products catalog:
-- Everyone (authenticated) can view the products catalog. Products are global.
CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING ( auth.uid() IS NOT NULL );

-- Policy for organization_products:
-- Users can read/write their organization's products if they belong to the organization
CREATE POLICY "Users can manage org products if they belong to the org" 
ON public.organization_products 
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

-- 3. Seed initial products
INSERT INTO public.products (name, code)
VALUES
  ('Transfert et logistic', 'kt_Transfert et logistic'),
  ('POS', 'kt_pos'),
  ('Inventaire', 'kt_inventaire'),
  ('Finance', 'kt_finance')
ON CONFLICT (code) DO NOTHING;

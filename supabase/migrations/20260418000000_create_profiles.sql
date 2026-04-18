-- Migration: Create profiles table and establish RLS

-- Create a table for public profiles
CREATE TABLE public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- Allow users to select only their own profile
CREATE POLICY "Users can select their own profile" 
ON public.profiles 
FOR SELECT 
USING ( auth.uid() = id );

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING ( auth.uid() = id );

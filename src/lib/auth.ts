import { supabase } from './supabaseClient';
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials, User } from '@supabase/supabase-js';

/**
 * Create a user profile.
 */
export async function createProfile(user: User, full_name: string, phone: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: user.id, full_name, phone }]);
    
  if (error) {
    console.error('Error creating profile:', error.message);
    throw error;
  }
  
  return data;
}

/**
 * Sign up a new user with their email and password.
 * Optionally pass profile data to create their profile immediately after sign up.
 */
export async function signUp(
  credentials: SignUpWithPasswordCredentials,
  profileData?: { full_name?: string; phone?: string }
) {
  const { data, error } = await supabase.auth.signUp(credentials);
  
  if (error) {
    console.error('Sign up error:', error.message);
    throw error;
  }
  
  if (data.user && profileData && (profileData.full_name || profileData.phone)) {
    try {
      await createProfile(data.user, profileData.full_name || '', profileData.phone || '');
    } catch (profileError) {
      console.error('User created, but profile creation failed:', profileError);
    }
  }
  
  return data;
}

/**
 * Ensure a profile exists for the user. Used during sign in or onboarding 
 * to recover from cases where the profile wasn't created during sign up.
 */
export async function ensureProfile(user: User, full_name?: string, phone?: string) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existing) {
    const name = full_name || user.email?.split('@')[0] || 'User';
    return await createProfile(user, name, phone || '');
  }
}

/**
 * Sign in an existing user with their email and password.
 */
export async function signIn(credentials: SignInWithPasswordCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  
  if (error) {
    console.error('Sign in error:', error.message);
    throw error;
  }

  if (data.user) {
    try {
      await ensureProfile(data.user);
    } catch (e) {
      console.warn('Could not ensure profile exists:', e);
    }
  }
  
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error.message);
    throw error;
  }
}

/**
 * Check if a user is a super admin.
 */
export async function isSuperAdmin(userId: string) {
  const { data, error } = await supabase
    .from('super_admins')
    .select('id')
    .eq('id', userId)
    .single();
    
  return !!data && !error;
}

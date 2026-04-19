import { supabase } from './supabaseClient';
import { getCurrentOrganizationId } from './organizations';

export interface Product {
  id: string;
  name: string;
  code: string;
}

export interface OrganizationProduct {
  id: string;
  organization_id: string;
  product_id: string;
  is_active: boolean;
  products?: Product;
}

/**
 * Fetches all products activated (or explicitly deactivated) for the current organization.
 * Includes the linked product payload.
 */
export async function getOrganizationProducts(organization_id?: string) {
  const orgId = organization_id || getCurrentOrganizationId();

  const { data, error } = await supabase
    .from('organization_products')
    .select(`
      id,
      organization_id,
      product_id,
      is_active,
      products (*)
    `)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error fetching organization products:', error.message);
    throw error;
  }

  // Typecast the output to match our relations
  return data as unknown as OrganizationProduct[];
}

/**
 * Activates a product by its code for the current organization.
 */
export async function enableProductForOrganization(product_code: string, organization_id?: string) {
  const orgId = organization_id || getCurrentOrganizationId();

  // 1. Look up the product UUID by its code
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('code', product_code)
    .single();

  if (productError || !product) {
    console.error(`Error finding product with code "${product_code}":`, productError?.message);
    throw productError || new Error(`Product not found: ${product_code}`);
  }

  // 2. Upsert the mapping (activate if it exists but is disabled, or create new link)
  const { data, error } = await supabase
    .from('organization_products')
    .upsert([{ 
      organization_id: orgId, 
      product_id: product.id, 
      is_active: true 
    }], { 
      onConflict: 'organization_id, product_id' 
    })
    .select()
    .single();

  if (error) {
    console.error('Error enabling product:', error.message);
    throw error;
  }

  return data as OrganizationProduct;
}

/**
 * Fetches all global products.
 */
export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching all products:', error.message);
    throw error;
  }
  
  return data as Product[];
}

/**
 * Fetches all organization_products links globally (Super Admin only).
 */
export async function getAllOrganizationProducts() {
  const { data, error } = await supabase
    .from('organization_products')
    .select('*');

  if (error) {
    console.error('Error fetching all organization products:', error.message);
    throw error;
  }

  return data as OrganizationProduct[];
}

/**
 * Explicitly sets a product's active state for an organization. 

 * Can be used globally by super_admins over any organization.
 */
export async function setProductActiveState(product_id: string, organization_id: string, is_active: boolean) {
  const { data, error } = await supabase
    .from('organization_products')
    .upsert([{ 
      organization_id, 
      product_id, 
      is_active 
    }], { 
      onConflict: 'organization_id, product_id' 
    })
    .select()
    .single();

  if (error) {
    console.error('Error setting product state:', error.message);
    throw error;
  }

  return data as OrganizationProduct;
}

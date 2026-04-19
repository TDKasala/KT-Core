import Dexie, { type Table } from 'dexie';

export interface OfflineProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  organization_id: string;
}

export interface OfflineSale {
  id?: string;
  temp_id?: string; // Used while offline if id is not yet assigned by server
  organization_id: string;
  branch_id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  synced: boolean;
}

export interface OfflineSaleItem {
  id?: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export class KTPOSDatabase extends Dexie {
  products!: Table<OfflineProduct>;
  sales!: Table<OfflineSale>;
  sale_items!: Table<OfflineSaleItem>;

  constructor() {
    super('KTPOSDatabase');
    this.version(2).stores({ // Bumped version to 2 for schema change
      products: 'id, organization_id, name',
      sales: '++temp_id, id, organization_id, branch_id, user_id, synced, created_at',
      sale_items: '++id, sale_id, product_id'
    }).upgrade(tx => {
      // Add branch_id to existing sales if any
      return tx.table('sales').toCollection().modify(sale => {
        if (!sale.branch_id) sale.branch_id = 'unknown';
      });
    });
  }
}

export const db = new KTPOSDatabase();

/**
 * Saves a sale and its items to the offline database.
 * Also decrements stock from the local products table.
 */
export async function saveSaleOffline(sale: Omit<OfflineSale, 'synced'>, items: Omit<OfflineSaleItem, 'sale_id'>[]) {
  return await db.transaction('rw', db.sales, db.sale_items, db.products, async () => {
    // 1. Stock check
    for (const item of items) {
      const product = await db.products.get(item.product_id);
      if (!product) throw new Error(`Produit non trouvé: ${item.product_id}`);
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name} (Disponible: ${product.stock})`);
      }
    }

    // 2. Decrement stock
    for (const item of items) {
      await db.products
        .where('id')
        .equals(item.product_id)
        .modify(p => { p.stock -= item.quantity; });
    }

    // 3. Save Sale
    const temp_id = sale.temp_id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.sales.add({
      ...sale,
      temp_id,
      synced: false
    });

    // 4. Save Items
    const itemsToSave = items.map(item => ({
      ...item,
      sale_id: temp_id
    }));

    await db.sale_items.bulkAdd(itemsToSave);
    
    return temp_id;
  });
}

/**
 * Returns all sales that haven't been synced to the server yet, 
 * including their associated items.
 */
export async function getUnsyncedSalesWithItems() {
  const unsyncedSales = await db.sales
    .where('synced')
    .equals(0) // Usually represented as 0 in IndexedDB index
    .toArray();
  
  const results = [];
  for (const sale of unsyncedSales) {
    if (!sale.synced && sale.temp_id) {
      const items = await db.sale_items
        .where('sale_id')
        .equals(sale.temp_id)
        .toArray();
      results.push({ ...sale, items });
    }
  }
  return results;
}

/**
 * Marks a sale as synced and optionally updates it with the real server-side ID.
 */
export async function markSaleAsSynced(temp_id: string, server_id?: string) {
  return await db.sales
    .where('temp_id')
    .equals(temp_id)
    .modify({ 
      synced: true,
      id: server_id || undefined
    });
}

/**
 * Helper to sync products from server to local DB for offline access.
 * Replaces existing local products for the given organization.
 */
export async function syncProductsToOffline(organizationId: string, products: OfflineProduct[]) {
  return await db.transaction('rw', db.products, async () => {
    // 1. Remove old products for this organization
    await db.products
      .where('organization_id')
      .equals(organizationId)
      .delete();
      
    // 2. Add new ones
    if (products.length > 0) {
      await db.products.bulkAdd(products);
    }
  });
}

/**
 * Fetches products from the offline database.
 */
export async function getOfflineProducts(organizationId: string) {
  return await db.products
    .where('organization_id')
    .equals(organizationId)
    .sortBy('name');
}

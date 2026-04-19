import { supabase } from '../lib/supabaseClient';
import { getUnsyncedSalesWithItems, markSaleAsSynced } from '../lib/db';

let isSyncing = false;

/**
 * Background sync function that pushes unsynced sales from local DB to Supabase.
 */
export async function syncOfflineSales() {
  if (isSyncing || !navigator.onLine) return;
  
  isSyncing = true;
  console.log('Background Sync: Checking for unsynced sales...');

  try {
    const unsyncedData = await getUnsyncedSalesWithItems();
    
    if (unsyncedData.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`Background Sync: Found ${unsyncedData.length} sales to sync.`);

    for (const record of unsyncedData) {
      try {
        const { items, temp_id, synced, ...saleData } = record;
        
        // 1. Check if sale already exists in Supabase (prevent duplicates)
        // We use client-side generated temp_id as a reference if it was already used
        const { data: existingSale } = await supabase
          .from('sales')
          .select('id')
          .eq('organization_id', saleData.organization_id)
          .eq('branch_id', saleData.branch_id)
          .eq('user_id', saleData.user_id)
          .eq('total', saleData.total)
          .eq('created_at', saleData.created_at)
          .maybeSingle();

        let finalSaleId: string;

        if (existingSale) {
          finalSaleId = existingSale.id;
        } else {
          // 2. Insert Sale
          const { data: newSale, error: saleError } = await supabase
            .from('sales')
            .insert([saleData])
            .select()
            .single();

          if (saleError || !newSale) throw saleError;
          finalSaleId = newSale.id;

          // 3. Insert Sale Items
          const saleItemsToSync = items.map((item: any) => ({
            sale_id: finalSaleId,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          }));

          const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItemsToSync);

          if (itemsError) throw itemsError;

          // 4. Update Stock in Supabase
          for (const item of items) {
            // Fetch current stock first (simple but sensitive to race conditions)
            const { data: prod } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();
            
            if (prod) {
              await supabase
                .from('products')
                .update({ stock: Math.max(0, prod.stock - item.quantity) })
                .eq('id', item.product_id);
            }
          }
        }

        // 5. Mark as synced locally
        if (temp_id) {
          await markSaleAsSynced(temp_id, finalSaleId);
        }
        
      } catch (err) {
        console.error(`Background Sync: Failed to sync sale ${record.temp_id}:`, err);
        // Continue to next sale, this one will remain unsynced for next run
      }
    }
  } catch (err) {
    console.error('Background Sync: Fatal error during sync process:', err);
  } finally {
    isSyncing = false;
    console.log('Background Sync: Finished.');
  }
}

/**
 * Hook or setup function to start the background sync process.
 */
export function startBackgroundSync() {
  // Initial sync attempt
  syncOfflineSales();

  // Periodic sync every 30 seconds
  const intervalId = setInterval(syncOfflineSales, 30000);

  // Sync on reconnect
  window.addEventListener('online', syncOfflineSales);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('online', syncOfflineSales);
  };
}

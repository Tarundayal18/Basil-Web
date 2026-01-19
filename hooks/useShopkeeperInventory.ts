/**
 * Shopkeeper Inventory Hook
 * Provides inventory management functionality with pagination and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { inventoryService, Product } from '@/services/inventory.service';
import { useStore } from '@/contexts/StoreContext';
import { ApiError } from '@/lib/api';

// Re-export Product type for convenience
export type { Product };

interface UseShopkeeperInventoryOptions {
  pageSize?: number;
  autoLoad?: boolean;
}

interface UseShopkeeperInventoryReturn {
  items: Product[];
  loading: boolean;
  error: ApiError | string | null;
  hasMore: boolean;
  currentPage: number;
  totalItems: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createProduct: (product: Partial<Product>) => Promise<{ success: boolean; data?: Product; error?: string }>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export function useShopkeeperInventory(
  pageSize: number = 20,
  options: UseShopkeeperInventoryOptions = {}
): UseShopkeeperInventoryReturn {
  const { selectedStore } = useStore();
  const { autoLoad = true } = options;

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /**
   * Load products
   */
  const loadProducts = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!selectedStore?.id) {
      setError('No store selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await inventoryService.getInventory({
        storeId: selectedStore.id,
        limit: pageSize,
        // TODO: Implement proper pagination with lastKey for subsequent pages
        lastKey: page > 1 ? undefined : undefined,
      });

      if (response && response.data) {
        const newItems = response.data || [];
        
        if (append) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }

        const pagination = response.pagination;
        setTotalItems(pagination?.totalCount || newItems.length);
        setHasMore(pagination?.hasMore ?? newItems.length === pageSize);
        setCurrentPage(page);
      } else {
        setError('Failed to load products');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load products';
      setError(errorMessage);
      console.error('Load products error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, pageSize]);

  /**
   * Load more products (pagination)
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await loadProducts(currentPage + 1, true);
  }, [loading, hasMore, currentPage, loadProducts]);

  /**
   * Refresh products list
   */
  const refresh = useCallback(async () => {
    setCurrentPage(1);
    await loadProducts(1, false);
  }, [loadProducts]);

  /**
   * Create a new product
   */
  const createProduct = useCallback(async (product: Partial<Product>) => {
    if (!selectedStore?.id) {
      return { success: false, error: 'No store selected' };
    }

    setError(null);

    try {
      const response = await inventoryService.createProduct({
        ...product,
        storeId: selectedStore.id,
      } as any);

      // Refresh the list to include the new product
      await refresh();
      return { success: true, data: response };
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create product';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [selectedStore?.id, refresh]);

  /**
   * Update an existing product
   */
  const updateProduct = useCallback(async (id: string, product: Partial<Product>) => {
    if (!selectedStore?.id) {
      return { success: false, error: 'No store selected' };
    }

    setError(null);

    try {
      await inventoryService.updateProduct(id, {
        ...product,
        storeId: selectedStore.id,
      } as any, selectedStore.id);

      // Update the item in the list
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...product } : item))
      );
      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update product';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [selectedStore?.id]);

  /**
   * Delete a product
   */
  const deleteProduct = useCallback(async (id: string) => {
    if (!selectedStore?.id) {
      return { success: false, error: 'No store selected' };
    }

    setError(null);

    try {
      await inventoryService.deleteProduct(id, selectedStore.id);

      // Remove the item from the list
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotalItems((prev) => prev - 1);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to delete product';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [selectedStore?.id]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount and when store changes
  useEffect(() => {
    if (autoLoad && selectedStore?.id) {
      loadProducts(1, false);
    }
  }, [autoLoad, selectedStore?.id, loadProducts]);

  return {
    items,
    loading,
    error,
    hasMore,
    currentPage,
    totalItems,
    loadMore,
    refresh,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError,
  };
}

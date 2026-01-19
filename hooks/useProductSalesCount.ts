import { useState, useEffect, useRef } from "react";
import { ordersService } from "@/services/orders.service";

/**
 * Hook to fetch and cache product sales counts
 * Calculates total quantity sold per product from recent orders
 */
export function useProductSalesCount(storeId?: string) {
  const [salesCounts, setSalesCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<{ storeId?: string; timestamp: number; data: Map<string, number> }>({
    timestamp: 0,
    data: new Map(),
  });
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    if (!storeId) return;

    // Check cache
    const now = Date.now();
    if (
      cacheRef.current.storeId === storeId &&
      cacheRef.current.timestamp > 0 &&
      now - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setSalesCounts(cacheRef.current.data);
      return;
    }

    // Fetch sales data
    const fetchSalesCounts = async () => {
      try {
        setLoading(true);
        const salesMap = new Map<string, number>();

        // Fetch recent orders (last 90 days)
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        let lastKey: string | undefined = undefined;
        let hasMore = true;
        let totalFetched = 0;
        const maxOrders = 500; // Limit to avoid too many API calls

        while (hasMore && totalFetched < maxOrders) {
          const response = await ordersService.getOrders({
            storeId,
            startDate,
            endDate,
            limit: 100,
            lastKey,
          });

          // Process order items to count product sales
          for (const order of response.data) {
            if (order.status !== "completed") continue;

            for (const item of order.orderItems || []) {
              // Try to get productId from product object first, then check for direct productId field
              const productId = item.product?.id || (item as any).productId;
              if (productId) {
                const quantity = item.quantity || 0;
                const currentCount = salesMap.get(productId) || 0;
                salesMap.set(productId, currentCount + quantity);
              }
            }
          }

          lastKey = response.pagination.lastKey || undefined;
          hasMore = response.pagination.hasMore;
          totalFetched += response.data.length;

          if (!hasMore || !lastKey) break;
        }

        // Update cache
        cacheRef.current = {
          storeId,
          timestamp: now,
          data: salesMap,
        };

        setSalesCounts(salesMap);
      } catch (error) {
        console.error("Failed to fetch product sales counts:", error);
        // Use empty map on error
        setSalesCounts(new Map());
      } finally {
        setLoading(false);
      }
    };

    fetchSalesCounts();
  }, [storeId]);

  return { salesCounts, loading };
}


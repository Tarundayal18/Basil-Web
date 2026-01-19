"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { apiClient } from "@/lib/api";
import { useAuth } from "./AuthContext";

interface Store {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  upiId?: string;
  isActive: boolean;
}

interface StoreContextType {
  stores: Store[];
  selectedStore: Store | null;
  loading: boolean;
  error: string | null;
  refreshStores: () => Promise<void>;
  selectStore: (storeId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const SELECTED_STORE_KEY = "selectedStoreId";

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Store[]>("/shopkeeper/stores");
      if (response.data && Array.isArray(response.data)) {
        const storesData = response.data;
        setStores(storesData);

        // Select store:
        // - Prefer the persisted selection (set by UI and/or /shopkeeper/profile payload)
        // - Fall back to the first available store
        const savedId =
          typeof window !== "undefined"
            ? localStorage.getItem(SELECTED_STORE_KEY)
            : null;

        const resolved =
          (savedId && storesData.find((s) => s.id === savedId)) ||
          (storesData.length > 0 ? storesData[0] : null);

        setSelectedStore((prev) => {
          if (prev?.id !== resolved?.id) return resolved;
          return prev;
        });

        // Keep persisted storeId in sync (avoid stale IDs)
        if (typeof window !== "undefined") {
          if (resolved?.id) {
            localStorage.setItem(SELECTED_STORE_KEY, resolved.id);
          } else {
            localStorage.removeItem(SELECTED_STORE_KEY);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      setError(err instanceof Error ? err.message : "Failed to load stores");
      setStores([]);
      setSelectedStore(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStores();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchStores]);

  // Memoize context value to prevent unnecessary re-renders
  const selectStore = useCallback(
    (storeId: string) => {
      const next = stores.find((s) => s.id === storeId) || null;
      setSelectedStore((prev) => {
        if (prev?.id !== next?.id) return next;
        return prev;
      });
      if (typeof window !== "undefined") {
        if (next?.id) {
          localStorage.setItem(SELECTED_STORE_KEY, next.id);
        } else {
          localStorage.removeItem(SELECTED_STORE_KEY);
        }
      }
    },
    [stores]
  );

  const contextValue = useMemo(
    () => ({
      stores,
      selectedStore,
      loading,
      error,
      refreshStores: fetchStores,
      selectStore,
    }),
    [stores, selectedStore, loading, error, fetchStores, selectStore]
  );

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

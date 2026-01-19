"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import InventoryPage from "@/components/InventoryPage";

/**
 * Products/Inventory page route
 */
function ProductsPageContent() {
  useAnalytics("Products Page", true);
  return <InventoryPage />;
}

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <ProductsPageContent />
    </ProtectedRoute>
  );
}

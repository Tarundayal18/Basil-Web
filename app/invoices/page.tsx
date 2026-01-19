/**
 * This file contains the invoices page route which displays all customer invoices/bills.
 */

"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrdersPage from "@/components/OrdersPage";
import InvoicesHubNav from "@/components/billing/InvoicesHubNav";

/**
 * Invoices page content component
 */
function InvoicesContent() {
  useAnalytics("Invoices Page", true);
  return (
    <div className="space-y-6">
      <InvoicesHubNav />
      <OrdersPage />
    </div>
  );
}

/**
 * Invoices page route
 */
export default function Invoices() {
  return (
    <ProtectedRoute>
      <InvoicesContent />
    </ProtectedRoute>
  );
}

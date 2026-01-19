/**
 * This file contains the billing page route which displays the create bill interface.
 */

"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreateBillPage from "@/components/billing/CreateBillPage";

/**
 * Billing page content component
 */
function BillingContent() {
  useAnalytics("Billing Page", true);
  return <CreateBillPage />;
}

/**
 * Billing page route
 */
export default function Billing() {
  return (
    <ProtectedRoute>
      <BillingContent />
    </ProtectedRoute>
  );
}

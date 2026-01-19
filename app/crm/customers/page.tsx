"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import CustomersPage from "@/components/CustomersPage";

/**
 * CRM Customers page route
 * This page lists all customers for CRM purposes
 */
function CRMCustomersContent() {
  useAnalytics("CRM Customers Page", true);
  return <CustomersPage />;
}

export default function CRMCustomers() {
  return (
    <ProtectedRoute>
      <CRMCustomersContent />
    </ProtectedRoute>
  );
}

"use client";

import AuthGuard from "@/components/ProtectedRoute";
import ScannedBillsPage from "@/components/scanned-bills/ScannedBillsPage";
import InvoicesHubNav from "@/components/billing/InvoicesHubNav";

export default function ScannedBillsRoute() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        <InvoicesHubNav />
        <ScannedBillsPage />
      </div>
    </AuthGuard>
  );
}


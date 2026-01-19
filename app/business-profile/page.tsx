/**
 * Business Profile Page (legacy route)
 * Kept for backward compatibility; Workspace surfaces it via tabs.
 */

import ProtectedRoute from "@/components/ProtectedRoute";
import BusinessProfileClient from "./ui";

export default function BusinessProfile() {
  return (
    <ProtectedRoute>
      <BusinessProfileClient />
    </ProtectedRoute>
  );
}

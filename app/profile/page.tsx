"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfilePage from "@/components/ProfilePage";

/**
 * Profile page route
 */
function ProfileContent() {
  useAnalytics("Profile Page", true);
  return <ProfilePage />;
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

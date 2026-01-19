import ProtectedRoute from "@/components/ProtectedRoute";
import AddStoreClient from "./ui";

export default function AddStore() {
  return (
    <ProtectedRoute>
      <AddStoreClient />
    </ProtectedRoute>
  );
}

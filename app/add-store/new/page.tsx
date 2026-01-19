import ProtectedRoute from "@/components/ProtectedRoute";
import AddStoreNewClient from "./ui";

export default function AddStoreNew() {
  return (
    <ProtectedRoute>
      <AddStoreNewClient />
    </ProtectedRoute>
  );
}


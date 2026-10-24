import { AdminOperations } from "@/features/operations/AdminOperations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminOperations />
    </ProtectedRoute>
  );
}

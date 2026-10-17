import { ExpertApproval } from "@/features/admin/ExpertApproval";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute requiredRole="admin">
      <ExpertApproval />
    </ProtectedRoute>
  );
}

import { Settlements } from "@/features/operations/Settlements";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute requiredRole="expert">
      <Settlements />
    </ProtectedRoute>
  );
}

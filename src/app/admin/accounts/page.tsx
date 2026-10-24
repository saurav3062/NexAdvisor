import { AccountControls } from "@/features/operations/AccountControls";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AccountControls />
    </ProtectedRoute>
  );
}

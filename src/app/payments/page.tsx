import { Payments } from "@/features/payments/Payments";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute>
      <Payments />
    </ProtectedRoute>
  );
}

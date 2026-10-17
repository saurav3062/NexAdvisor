import { Dashboard } from "@/features/bookings/Bookings";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

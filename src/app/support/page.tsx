import { Support } from "@/features/operations/Support";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute>
      <Support />
    </ProtectedRoute>
  );
}

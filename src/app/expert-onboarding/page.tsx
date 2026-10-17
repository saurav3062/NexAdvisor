import { ExpertEditor } from "@/features/experts/ExpertEditor";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute requiredRole="expert">
      <ExpertEditor />
    </ProtectedRoute>
  );
}

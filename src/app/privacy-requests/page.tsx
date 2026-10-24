import { PrivacyRequests } from "@/features/operations/PrivacyRequests";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute>
      <PrivacyRequests />
    </ProtectedRoute>
  );
}

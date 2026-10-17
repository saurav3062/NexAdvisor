import { Profile } from "@/features/account/Profile";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

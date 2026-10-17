import { Favorites } from "@/features/experts/Favorites";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute>
      <Favorites />
    </ProtectedRoute>
  );
}

import { VideoSession } from "@/features/conversations/VideoSession";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute>
      <VideoSession />
    </ProtectedRoute>
  );
}

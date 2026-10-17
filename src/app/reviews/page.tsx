import { Conversations } from "@/features/conversations/Conversations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
export default function Page() {
  return (
    <ProtectedRoute>
      <Conversations reviews />
    </ProtectedRoute>
  );
}

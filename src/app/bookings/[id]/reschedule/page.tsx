import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Reschedule } from "@/features/bookings/Reschedule";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <Reschedule id={id} />
    </ProtectedRoute>
  );
}

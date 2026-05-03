import { Navigate } from "react-router";
import { useAuth } from "../stores/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const isLoading = useAuth((s) => s.isLoading);
  const isInitialized = useAuth((s) => s.isInitialized);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

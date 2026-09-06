import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-sm text-neutral-400">Loading…</div>;
  }

  return user ? <DashboardPage /> : <LoginPage />;
}
